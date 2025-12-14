<?php
// app/Services/PythonBridgeService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use App\Jobs\ProcessPythonRequest;
use App\Jobs\GenerateSlipsJob;
use Carbon\Carbon;

class PythonBridgeService
{
    protected $pythonUrl;
    protected $timeout;
    protected $retryAttempts;

    public function __construct()
    {
        $this->pythonUrl = config('python.service.url');
        $this->timeout = config('python.service.timeout');
        $this->retryAttempts = config('python.service.retry_attempts');
    }

    /**
     * Send request to Python service with retry logic
     */
    public function sendRequest(string $endpoint, array $data = [], string $method = 'post')
    {
        $url = $this->pythonUrl . $endpoint;
        $cacheKey = $this->generateCacheKey($endpoint, $data);

        // Check cache first
        $cachedResponse = Cache::get($cacheKey);
        if ($cachedResponse) {
            Log::info('Returning cached response for: ' . $endpoint);
            return $cachedResponse;
        }

        $attempts = 0;

        while ($attempts < $this->retryAttempts) {
            try {
                $response = Http::timeout($this->timeout)
                    ->{$method}($url, $data);

                if ($response->successful()) {
                    $result = $response->json();

                    // Cache successful responses
                    $ttl = $this->getCacheTtl($endpoint);
                    Cache::put($cacheKey, $result, $ttl);

                    return $result;
                }

                Log::warning("Python service request failed (attempt {$attempts}): " . $response->status());

            } catch (\Exception $e) {
                Log::error("Python service error (attempt {$attempts}): " . $e->getMessage());
            }

            $attempts++;

            if ($attempts < $this->retryAttempts) {
                usleep(config('python.service.retry_delay') * 1000);
            }
        }

        // All attempts failed, queue for later processing
        return $this->queueForProcessing($endpoint, $data, $method);
    }

    /**
     * Analyze a single match
     */
    public function analyzeMatch(int $matchId)
    {
        // Get match data from database
        $match = \App\Models\MatchModel::with([
            'homeTeam',
            'awayTeam',
            'teamForms',
            'headToHead'
        ])->find($matchId);

        if (!$match) {
            throw new \Exception("Match not found: {$matchId}");
        }

        // Prepare data for Python
        $data = [
            'match_id' => $match->id,
            'match_data' => $this->formatMatchData($match),
            'home_team_form' => $this->formatTeamFormData($match->homeTeam, 'home', $match->id),
            'away_team_form' => $this->formatTeamFormData($match->awayTeam, 'away', $match->id),
            'head_to_head' => $match->headToHead ? $match->headToHead->toArray() : null,
            'odds' => $match->odds ?? [],
        ];

        // Send to Python service
        return $this->sendRequest(config('python.endpoints.analyze_match'), $data);
    }

    /**
     * Analyze multiple matches in batch
     */
    public function analyzeBatch(array $matchIds)
    {
        if (count($matchIds) > config('python.queues.batch_size')) {
            // Queue large batches
            return $this->queueBatchAnalysis($matchIds);
        }

        $matchesData = [];

        foreach ($matchIds as $matchId) {
            $match = \App\Models\MatchModel::with(['homeTeam', 'awayTeam', 'teamForms'])
                ->find($matchId);

            if ($match) {
                $matchesData[] = [
                    'match_id' => $match->id,
                    'match_data' => $this->formatMatchData($match),
                    'home_team_form' => $this->formatTeamFormData($match->homeTeam, 'home', $match->id),
                    'away_team_form' => $this->formatTeamFormData($match->awayTeam, 'away', $match->id),
                ];
            }
        }

        return $this->sendRequest(config('python.endpoints.analyze_batch'), [
            'matches' => $matchesData
        ]);
    }

    /**
     * Analyze team form
     */
    public function analyzeTeamForm(string $teamCode, string $venue = null)
    {
        $team = \App\Models\Team::where('code', $teamCode)->first();

        if (!$team) {
            throw new \Exception("Team not found: {$teamCode}");
        }

        // Get recent team forms
        $query = \App\Models\Team_Form::where('team_id', $teamCode);

        if ($venue) {
            $query->where('venue', $venue);
        }

        $recentForms = $query->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $data = [
            'team_code' => $teamCode,
            'team_data' => $team->toMLFormat(),
            'recent_forms' => $recentForms->map(function ($form) {
                return $form->toArray();
            })->toArray(),
            'venue' => $venue,
        ];

        return $this->sendRequest(config('python.endpoints.analyze_team_form'), $data);
    }

    /**
     * Analyze head-to-head data
     */
    public function analyzeHeadToHead(int $matchId)
    {
        $h2h = \App\Models\Head_To_Head::where('match_id', $matchId)->first();

        if (!$h2h) {
            // Try to generate H2H data
            $match = \App\Models\MatchModel::find($matchId);
            if (!$match) {
                throw new \Exception("Match not found: {$matchId}");
            }

            $h2h = $this->generateHeadToHeadData($match);
        }

        return $this->sendRequest(config('python.endpoints.analyze_head_to_head'), [
            'head_to_head' => $h2h->toArray(),
            'match_id' => $matchId,
        ]);
    }

    /**
     * Generate accumulator slips
     */
    public function generateSlips(array $masterSlip, array $options = [])
    {
        $defaultOptions = [
            'max_slips' => 100,
            'strategies' => ['monte_carlo', 'coverage', 'ml_prediction'],
            'risk_profile' => 'balanced',
            'min_odds' => 1.5,
            'max_odds' => 10.0,
            'bankroll_percentage' => 5,
        ];

        $options = array_merge($defaultOptions, $options);

        $data = [
            'master_slip' => $masterSlip,
            'options' => $options,
            'match_data' => $this->getMatchesData($masterSlip['matches'] ?? []),
        ];

        return $this->sendRequest(config('python.endpoints.generate_slips'), $data);
    }

    /**
     * Generate predictions using ML model
     */
    public function generatePredictions(array $matchIds, string $model = null)
    {
        if (!$model) {
            $model = config('python.ml.models.prediction');
        }

        $matches = \App\Models\MatchModel::with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])
            ->whereIn('id', $matchIds)
            ->get();

        $matchesData = $matches->map(function ($match) {
            return [
                'match_id' => $match->id,
                'match_data' => $this->formatMatchData($match),
                'home_team_form' => $this->formatTeamFormData($match->homeTeam, 'home', $match->id),
                'away_team_form' => $this->formatTeamFormData($match->awayTeam, 'away', $match->id),
                'head_to_head' => $match->headToHead ? $match->headToHead->toArray() : null,
                'odds' => $match->odds ?? [],
            ];
        })->toArray();

        return $this->sendRequest(config('python.endpoints.generate_predictions'), [
            'matches' => $matchesData,
            'model' => $model,
            'timestamp' => Carbon::now()->toISOString(),
        ]);
    }

    /**
     * Train ML model
     */
    public function trainModel(string $modelType, array $trainingData = null)
    {
        if (!$trainingData) {
            // Get historical data for training
            $trainingData = $this->getTrainingData($modelType);
        }

        return $this->sendRequest(config('python.endpoints.train_model'), [
            'model_type' => $modelType,
            'training_data' => $trainingData,
            'config' => config('python.ml'),
        ]);
    }

    /**
     * Check Python service health
     */
    public function checkHealth()
    {
        try {
            $response = Http::timeout(5)
                ->get($this->pythonUrl . config('python.endpoints.health'));

            return [
                'status' => $response->successful() ? 'healthy' : 'unhealthy',
                'response' => $response->json(),
                'timestamp' => Carbon::now()->toISOString(),
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'unreachable',
                'error' => $e->getMessage(),
                'timestamp' => Carbon::now()->toISOString(),
            ];
        }
    }

    /**
     * Clear Python-related caches
     */
    public function clearCache(string $type = null)
    {
        if ($type) {
            $pattern = "python_{$type}_*";
        } else {
            $pattern = "python_*";
        }

        Cache::flush($pattern);

        return [
            'cleared' => $pattern,
            'timestamp' => Carbon::now()->toISOString(),
        ];
    }

    /**
     * Format match data for Python
     */
    protected function formatMatchData($match)
    {
        return [
            'id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
            'home_team_code' => $match->home_team_code,
            'away_team_code' => $match->away_team_code,
            'league' => $match->league,
            'competition' => $match->competition,
            'match_date' => $match->match_date,
            'venue' => $match->venue,
            'match_time' => $match->match_time,
            'odds' => $match->odds ?? [],
            'weather_conditions' => $match->weather_conditions,
            'referee' => $match->referee,
            'importance' => $match->importance,
            'status' => $match->status,
        ];
    }

    /**
     * Format team form data for Python
     */
    protected function formatTeamFormData($team, $venue, $matchId = null)
    {
        if (!$team) {
            return null;
        }

        $query = \App\Models\Team_Form::where('team_id', $team->code)
            ->where('venue', $venue);

        if ($matchId) {
            $query->where('match_id', $matchId);
        }

        $form = $query->orderBy('created_at', 'desc')->first();

        if ($form) {
            return $form->toArray();
        }

        // Return basic team data if no specific form
        return [
            'team_id' => $team->code,
            'venue' => $venue,
            'form_rating' => $team->form_rating ?? 5.0,
            'form_momentum' => $team->momentum ?? 0,
            'avg_goals_scored' => $team->avg_goals_scored ?? 0,
            'avg_goals_conceded' => $team->avg_goals_conceded ?? 0,
        ];
    }

    /**
     * Generate head-to-head data from match
     */
    protected function generateHeadToHeadData($match)
    {
        // Find historical matches between these teams
        $historicalMatches = \App\Models\MatchModel::where(function ($query) use ($match) {
            $query->where('home_team_code', $match->home_team_code)
                ->where('away_team_code', $match->away_team_code);
        })->orWhere(function ($query) use ($match) {
            $query->where('home_team_code', $match->away_team_code)
                ->where('away_team_code', $match->home_team_code);
        })->where('id', '!=', $match->id)
            ->orderBy('match_date', 'desc')
            ->limit(20)
            ->get();

        $homeWins = 0;
        $awayWins = 0;
        $draws = 0;
        $homeGoals = 0;
        $awayGoals = 0;

        $lastMeetings = [];

        foreach ($historicalMatches as $historical) {
            $isHomeTeamCurrentHome = $historical->home_team_code === $match->home_team_code;

            if ($historical->home_score > $historical->away_score) {
                if ($isHomeTeamCurrentHome) {
                    $homeWins++;
                } else {
                    $awayWins++;
                }
            } elseif ($historical->home_score < $historical->away_score) {
                if ($isHomeTeamCurrentHome) {
                    $awayWins++;
                } else {
                    $homeWins++;
                }
            } else {
                $draws++;
            }

            if ($isHomeTeamCurrentHome) {
                $homeGoals += $historical->home_score;
                $awayGoals += $historical->away_score;
            } else {
                $homeGoals += $historical->away_score;
                $awayGoals += $historical->home_score;
            }

            $lastMeetings[] = [
                'date' => $historical->match_date,
                'result' => $this->determineResult($historical, $match->home_team_code),
                'score' => $historical->home_score . '-' . $historical->away_score,
                'venue' => $isHomeTeamCurrentHome ? 'home' : 'away',
            ];
        }

        $total = $homeWins + $awayWins + $draws;

        // Create or update H2H record
        return \App\Models\Head_To_Head::updateOrCreate(
            ['match_id' => $match->id],
            [
                'form' => "{$homeWins}-{$draws}-{$awayWins}",
                'home_wins' => $homeWins,
                'away_wins' => $awayWins,
                'draws' => $draws,
                'total_meetings' => $total,
                'home_goals' => $homeGoals,
                'away_goals' => $awayGoals,
                'last_meetings' => $lastMeetings,
                'last_meeting_date' => count($lastMeetings) > 0 ? $lastMeetings[0]['date'] : null,
                'last_meeting_result' => count($lastMeetings) > 0 ? $lastMeetings[0]['result'] : null,
                'stats' => [
                    'home_win_percentage' => $total > 0 ? round(($homeWins / $total) * 100, 2) : 0,
                    'away_win_percentage' => $total > 0 ? round(($awayWins / $total) * 100, 2) : 0,
                    'draw_percentage' => $total > 0 ? round(($draws / $total) * 100, 2) : 0,
                    'avg_home_goals' => $total > 0 ? round($homeGoals / $total, 2) : 0,
                    'avg_away_goals' => $total > 0 ? round($awayGoals / $total, 2) : 0,
                ],
            ]
        );
    }

    /**
     * Get matches data for slip generation
     */
    protected function getMatchesData(array $matchIds)
    {
        $matches = \App\Models\MatchModel::with(['homeTeam', 'awayTeam', 'teamForms'])
            ->whereIn('id', $matchIds)
            ->get();

        return $matches->map(function ($match) {
            return [
                'match_id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'odds' => $match->odds ?? [],
                'prediction' => $match->prediction ?? null,
                'form_data' => [
                    'home' => $this->formatTeamFormData($match->homeTeam, 'home', $match->id),
                    'away' => $this->formatTeamFormData($match->awayTeam, 'away', $match->id),
                ],
            ];
        })->toArray();
    }

    /**
     * Get training data for ML model
     */
    protected function getTrainingData(string $modelType)
    {
        // Get historical matches with results
        $matches = \App\Models\MatchModel::with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])
            ->whereNotNull('result') // Only matches with known results
            ->where('match_date', '>=', Carbon::now()->subYears(2))
            ->limit(1000)
            ->get();

        return $matches->map(function ($match) use ($modelType) {
            $data = [
                'match_id' => $match->id,
                'match_data' => $this->formatMatchData($match),
                'home_team_form' => $this->formatTeamFormData($match->homeTeam, 'home', $match->id),
                'away_team_form' => $this->formatTeamFormData($match->awayTeam, 'away', $match->id),
                'head_to_head' => $match->headToHead ? $match->headToHead->toArray() : null,
                'odds' => $match->odds ?? [],
                'actual_result' => $match->result, // For training
                'outcome' => $this->determineOutcome($match),
            ];

            // Add model-specific features
            if ($modelType === 'form_analysis') {
                $data['form_features'] = $this->extractFormFeatures($match);
            } elseif ($modelType === 'h2h_analysis') {
                $data['h2h_features'] = $this->extractH2HFeatures($match);
            }

            return $data;
        })->toArray();
    }

    /**
     * Queue request for processing
     */
    protected function queueForProcessing(string $endpoint, array $data, string $method)
    {
        $jobId = uniqid('python_', true);

        ProcessPythonRequest::dispatch($endpoint, $data, $method, $jobId)
            ->onQueue(config('python.queues.default_queue'));

        Log::info("Queued Python request: {$endpoint} (job: {$jobId})");

        return [
            'status' => 'queued',
            'job_id' => $jobId,
            'message' => 'Request queued for processing',
            'timestamp' => Carbon::now()->toISOString(),
        ];
    }

    /**
     * Queue batch analysis
     */
    protected function queueBatchAnalysis(array $matchIds)
    {
        $jobId = uniqid('batch_', true);

        GenerateSlipsJob::dispatch($matchIds, $jobId)
            ->onQueue(config('python.queues.default_queue'));

        return [
            'status' => 'queued',
            'job_id' => $jobId,
            'matches_count' => count($matchIds),
            'message' => 'Batch analysis queued for processing',
            'timestamp' => Carbon::now()->toISOString(),
        ];
    }

    /**
     * Generate cache key
     */
    protected function generateCacheKey(string $endpoint, array $data)
    {
        $keyData = $endpoint . json_encode($data);
        return 'python_' . md5($keyData);
    }

    /**
     * Get cache TTL for endpoint
     */
    protected function getCacheTtl(string $endpoint)
    {
        $config = config('python.cache');

        if (strpos($endpoint, 'analyze-match') !== false) {
            return $config['match_analysis'];
        } elseif (strpos($endpoint, 'team-form') !== false) {
            return $config['team_form'];
        } elseif (strpos($endpoint, 'head-to-head') !== false) {
            return $config['h2h_analysis'];
        } elseif (strpos($endpoint, 'predict') !== false) {
            return $config['predictions'];
        }

        return 1800; // Default 30 minutes
    }

    /**
     * Determine match result relative to home team
     */
    protected function determineResult($match, $homeTeamCode)
    {
        if ($match->home_team_code === $homeTeamCode) {
            if ($match->home_score > $match->away_score)
                return 'home';
            if ($match->home_score < $match->away_score)
                return 'away';
            return 'draw';
        } else {
            if ($match->away_score > $match->home_score)
                return 'home';
            if ($match->away_score < $match->home_score)
                return 'away';
            return 'draw';
        }
    }

    /**
     * Determine match outcome
     */
    protected function determineOutcome($match)
    {
        if ($match->home_score > $match->away_score)
            return 'home_win';
        if ($match->home_score < $match->away_score)
            return 'away_win';
        return 'draw';
    }

    /**
     * Extract form features
     */
    protected function extractFormFeatures($match)
    {
        $homeForm = $this->formatTeamFormData($match->homeTeam, 'home', $match->id);
        $awayForm = $this->formatTeamFormData($match->awayTeam, 'away', $match->id);

        return [
            'form_advantage' => ($homeForm['form_rating'] ?? 5.0) - ($awayForm['form_rating'] ?? 5.0),
            'momentum_advantage' => ($homeForm['form_momentum'] ?? 0) - ($awayForm['form_momentum'] ?? 0),
            'goal_supremacy' => (($homeForm['avg_goals_scored'] ?? 0) - ($awayForm['avg_goals_conceded'] ?? 0)) -
                (($awayForm['avg_goals_scored'] ?? 0) - ($homeForm['avg_goals_conceded'] ?? 0)),
        ];
    }

    /**
     * Extract H2H features
     */
    protected function extractH2HFeatures($match)
    {
        if (!$match->headToHead) {
            return [];
        }

        $h2h = $match->headToHead;
        $total = $h2h->total_meetings;

        if ($total === 0) {
            return [];
        }

        return [
            'home_win_rate' => $h2h->home_wins / $total,
            'away_win_rate' => $h2h->away_wins / $total,
            'draw_rate' => $h2h->draws / $total,
            'goal_difference' => ($h2h->home_goals - $h2h->away_goals) / max($total, 1),
        ];
    }
}