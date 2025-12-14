<?php
// app/Jobs/ProcessMatchForML.php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\MatchModel;
use App\Models\Team_Form;
use App\Models\Head_To_Head;
use App\Models\Prediction;
use App\Services\PredictionService;

class ProcessMatchForML implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120;
    public $tries = 3;
    public $backoff = [10, 30, 60];

    protected $matchId;
    protected $processType;
    protected $options;

    /**
     * Create a new job instance.
     */
    public function __construct(int $matchId, string $processType = 'full', array $options = [])
    {
        $this->matchId = $matchId;
        $this->processType = $processType;
        $this->options = $options;
        
        $this->onQueue(config('python.queues.ml_processing', 'ml_processing'));
    }

    /**
     * Execute the job.
     */
    public function handle(PredictionService $predictionService)
    {
        Log::info('Processing match for ML', [
            'match_id' => $this->matchId,
            'process_type' => $this->processType,
            'queue' => $this->queue,
        ]);

        try {
            $match = MatchModel::with(['homeTeam', 'awayTeam'])->find($this->matchId);
            
            if (!$match) {
                throw new \Exception("Match not found: {$this->matchId}");
            }

            switch ($this->processType) {
                case 'form_analysis':
                    $this->processFormAnalysis($match);
                    break;
                    
                case 'head_to_head':
                    $this->processHeadToHead($match);
                    break;
                    
                case 'prediction':
                    $this->processPrediction($match, $predictionService);
                    break;
                    
                case 'full':
                default:
                    $this->processFullAnalysis($match, $predictionService);
                    break;
            }

            Log::info('Match ML processing completed successfully', [
                'match_id' => $this->matchId,
                'process_type' => $this->processType,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process match for ML', [
                'match_id' => $this->matchId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e; // Let Laravel handle retry
        }
    }

    /**
     * Process form analysis for match
     */
    protected function processFormAnalysis(MatchModel $match)
    {
        Log::info('Processing form analysis', [
            'match_id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
        ]);

        // Process home team form
        $this->updateTeamForm($match->homeTeam, 'home', $match);
        
        // Process away team form
        $this->updateTeamForm($match->awayTeam, 'away', $match);
        
        Log::info('Form analysis completed', ['match_id' => $match->id]);
    }

    /**
     * Update team form record
     */
    protected function updateTeamForm($team, string $venue, MatchModel $match)
    {
        if (!$team) {
            Log::warning('Team not found for form analysis', [
                'match_id' => $match->id,
                'venue' => $venue,
            ]);
            return;
        }

        // Get recent matches for this team at this venue
        $recentMatches = MatchModel::where(function($query) use ($team, $venue) {
            if ($venue === 'home') {
                $query->where('home_team_code', $team->code);
            } else {
                $query->where('away_team_code', $team->code);
            }
        })
        ->where('match_date', '<', $match->match_date)
        ->whereNotNull('result')
        ->orderBy('match_date', 'desc')
        ->limit(5)
        ->get();

        $rawForm = [];
        $matchesPlayed = 0;
        $wins = 0;
        $draws = 0;
        $losses = 0;
        $goalsScored = 0;
        $goalsConceded = 0;
        $cleanSheets = 0;
        $failedToScore = 0;

        foreach ($recentMatches as $recentMatch) {
            $isHomeTeam = $recentMatch->home_team_code === $team->code;
            
            // Determine outcome
            $homeScore = (int)explode('-', $recentMatch->result)[0];
            $awayScore = (int)explode('-', $recentMatch->result)[1];
            
            if ($isHomeTeam) {
                $teamScore = $homeScore;
                $opponentScore = $awayScore;
            } else {
                $teamScore = $awayScore;
                $opponentScore = $homeScore;
            }
            
            // Determine outcome
            $outcome = 'D';
            if ($teamScore > $opponentScore) {
                $outcome = 'W';
                $wins++;
            } elseif ($teamScore < $opponentScore) {
                $outcome = 'L';
                $losses++;
            } else {
                $draws++;
            }
            
            $goalsScored += $teamScore;
            $goalsConceded += $opponentScore;
            
            if ($teamScore === 0) $failedToScore++;
            if ($opponentScore === 0) $cleanSheets++;
            
            $matchesPlayed++;
            
            $rawForm[] = [
                'match_id' => $recentMatch->id,
                'date' => $recentMatch->match_date,
                'result' => $recentMatch->result,
                'outcome' => $outcome,
                'venue' => $isHomeTeam ? 'home' : 'away',
                'opponent' => $isHomeTeam ? $recentMatch->away_team : $recentMatch->home_team,
                'goals_scored' => $teamScore,
                'goals_conceded' => $opponentScore,
            ];
        }

        // Calculate averages
        $avgGoalsScored = $matchesPlayed > 0 ? $goalsScored / $matchesPlayed : 0;
        $avgGoalsConceded = $matchesPlayed > 0 ? $goalsConceded / $matchesPlayed : 0;

        // Calculate form rating (simplified)
        $formRating = 5.0; // Base rating
        if ($matchesPlayed > 0) {
            $winRate = $wins / $matchesPlayed;
            $drawRate = $draws / $matchesPlayed;
            $lossRate = $losses / $matchesPlayed;
            
            // Weight recent form more heavily
            $formRating = ($winRate * 8) + ($drawRate * 5) + ($lossRate * 2);
        }

        // Calculate form momentum (simplified)
        $formMomentum = 0.0;
        if (count($rawForm) >= 3) {
            $lastThree = array_slice($rawForm, 0, 3);
            $previousThree = array_slice($rawForm, 3, 3);
            
            if (count($previousThree) >= 3) {
                $currentPoints = $this->calculatePoints($lastThree);
                $previousPoints = $this->calculatePoints($previousThree);
                $formMomentum = ($currentPoints - $previousPoints) / 9; // Normalize to -1 to 1
            }
        }

        // Build form string
        $formString = '';
        foreach (array_slice($rawForm, 0, 5) as $matchData) {
            $formString .= $matchData['outcome'] ?? '';
        }

        // Create or update team form record
        Team_Form::updateOrCreate(
            [
                'match_id' => $match->id,
                'team_id' => $team->code,
                'venue' => $venue,
            ],
            [
                'raw_form' => $rawForm,
                'matches_played' => $matchesPlayed,
                'wins' => $wins,
                'draws' => $draws,
                'losses' => $losses,
                'goals_scored' => $goalsScored,
                'goals_conceded' => $goalsConceded,
                'avg_goals_scored' => round($avgGoalsScored, 2),
                'avg_goals_conceded' => round($avgGoalsConceded, 2),
                'form_rating' => round($formRating, 2),
                'form_momentum' => round($formMomentum, 3),
                'clean_sheets' => $cleanSheets,
                'failed_to_score' => $failedToScore,
                'form_string' => $formString,
                'win_probability' => $matchesPlayed > 0 ? round($wins / $matchesPlayed, 3) : 0.33,
                'draw_probability' => $matchesPlayed > 0 ? round($draws / $matchesPlayed, 3) : 0.33,
                'loss_probability' => $matchesPlayed > 0 ? round($losses / $matchesPlayed, 3) : 0.33,
            ]
        );

        Log::debug('Team form updated', [
            'team_id' => $team->code,
            'venue' => $venue,
            'form_rating' => $formRating,
            'matches_played' => $matchesPlayed,
        ]);
    }

    /**
     * Calculate points from match outcomes
     */
    protected function calculatePoints(array $matches): int
    {
        $points = 0;
        foreach ($matches as $match) {
            switch ($match['outcome'] ?? '') {
                case 'W':
                    $points += 3;
                    break;
                case 'D':
                    $points += 1;
                    break;
                case 'L':
                    $points += 0;
                    break;
            }
        }
        return $points;
    }

    /**
     * Process head-to-head analysis
     */
    protected function processHeadToHead(MatchModel $match)
    {
        Log::info('Processing head-to-head analysis', [
            'match_id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
        ]);

        // Find historical matches between these teams
        $historicalMatches = MatchModel::where(function ($query) use ($match) {
            $query->where('home_team_code', $match->home_team_code)
                ->where('away_team_code', $match->away_team_code);
        })->orWhere(function ($query) use ($match) {
            $query->where('home_team_code', $match->away_team_code)
                ->where('away_team_code', $match->home_team_code);
        })
        ->where('id', '!=', $match->id)
        ->whereNotNull('result')
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
            $scores = explode('-', $historical->result);
            $homeScore = (int)trim($scores[0]);
            $awayScore = (int)trim($scores[1]);

            if ($homeScore > $awayScore) {
                if ($isHomeTeamCurrentHome) {
                    $homeWins++;
                } else {
                    $awayWins++;
                }
            } elseif ($homeScore < $awayScore) {
                if ($isHomeTeamCurrentHome) {
                    $awayWins++;
                } else {
                    $homeWins++;
                }
            } else {
                $draws++;
            }

            if ($isHomeTeamCurrentHome) {
                $homeGoals += $homeScore;
                $awayGoals += $awayScore;
            } else {
                $homeGoals += $awayScore;
                $awayGoals += $homeScore;
            }

            $lastMeetings[] = [
                'date' => $historical->match_date,
                'result' => $this->determineResult($historical, $match->home_team_code),
                'score' => $historical->result,
                'venue' => $isHomeTeamCurrentHome ? 'home' : 'away',
                'home_team' => $historical->home_team,
                'away_team' => $historical->away_team,
            ];
        }

        $total = $homeWins + $awayWins + $draws;

        // Create or update H2H record
        Head_To_Head::updateOrCreate(
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

        Log::info('Head-to-head analysis completed', [
            'match_id' => $match->id,
            'total_meetings' => $total,
            'home_wins' => $homeWins,
            'away_wins' => $awayWins,
            'draws' => $draws,
        ]);
    }

    /**
     * Determine result relative to current home team
     */
    protected function determineResult($match, $currentHomeTeamCode)
    {
        $scores = explode('-', $match->result);
        $homeScore = (int)trim($scores[0]);
        $awayScore = (int)trim($scores[1]);

        if ($match->home_team_code === $currentHomeTeamCode) {
            if ($homeScore > $awayScore)
                return 'home';
            if ($homeScore < $awayScore)
                return 'away';
            return 'draw';
        } else {
            if ($awayScore > $homeScore)
                return 'home';
            if ($awayScore < $homeScore)
                return 'away';
            return 'draw';
        }
    }

    /**
     * Process prediction generation
     */
    protected function processPrediction(MatchModel $match, PredictionService $predictionService)
    {
        Log::info('Generating prediction for match', [
            'match_id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
        ]);

        // Generate prediction
        $result = $predictionService->generatePredictions(
            [$match->id],
            $this->options
        );

        if ($result['success']) {
            Log::info('Prediction generated successfully', [
                'match_id' => $match->id,
                'prediction_method' => $result['method'],
                'confidence' => $result['predictions'][0]['confidence'] ?? 0,
            ]);
        } else {
            throw new \Exception('Failed to generate prediction: ' . ($result['error'] ?? 'Unknown error'));
        }
    }

    /**
     * Process full analysis
     */
    protected function processFullAnalysis(MatchModel $match, PredictionService $predictionService)
    {
        Log::info('Starting full analysis for match', ['match_id' => $match->id]);

        // Step 1: Form analysis
        $this->processFormAnalysis($match);
        
        // Step 2: Head-to-head analysis
        $this->processHeadToHead($match);
        
        // Step 3: Generate prediction
        $this->processPrediction($match, $predictionService);
        
        // Step 4: Update match status
        $match->analysis_status = 'completed';
        $match->analysis_completed_at = Carbon::now();
        $match->save();

        Log::info('Full analysis completed for match', ['match_id' => $match->id]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::critical('ProcessMatchForML job failed', [
            'match_id' => $this->matchId,
            'process_type' => $this->processType,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Update match status to failed
        $match = MatchModel::find($this->matchId);
        if ($match) {
            $match->analysis_status = 'failed';
            $match->analysis_failed_at = Carbon::now();
            $match->analysis_error = $exception->getMessage();
            $match->save();
        }
    }
}