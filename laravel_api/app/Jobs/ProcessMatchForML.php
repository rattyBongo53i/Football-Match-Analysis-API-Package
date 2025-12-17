<?php
// app/Jobs/ProcessMatchForML.php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\MatchModel;
use App\Models\Team_Form;
use App\Models\Head_To_Head;
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
     * Update team form record using team ID
     */
    protected function updateTeamForm($team, string $venue, MatchModel $match)
    {
        if (!$team || !$team->id) {
            Log::warning('Team not found or missing ID for form analysis', [
                'match_id' => $match->id,
                'venue' => $venue,
            ]);
            return;
        }

        $teamId = $team->id;

        // Get recent completed matches where this team played in the correct venue
        $recentMatches = MatchModel::where(function ($query) use ($teamId, $venue) {
            if ($venue === 'home') {
                $query->where('home_team_id', $teamId);
            } else {
                $query->where('away_team_id', $teamId);
            }
        })
            ->where('match_date', '<', $match->match_date)
            ->whereNotNull('home_score')   // ← Added
            ->whereNotNull('away_score')   // ← Added
            ->orderBy('match_date', 'desc')
            ->limit(10) // Increased to 10 for better momentum calculation
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
            $isHome = $recentMatch->home_team_id === $teamId;

            // Parse result (e.g., "2-1")
            if (!$recentMatch->result || !str_contains($recentMatch->result, '-')) {
                continue;
            }

            $homeScore = (int) $recentMatch->home_score;
            $awayScore = (int) $recentMatch->away_score;

            // Build result string for raw_form (optional, for consistency)
            $resultString = "{$homeScore}-{$awayScore}";

            $teamScore = $isHome ? $homeScore : $awayScore;
            $opponentScore = $isHome ? $awayScore : $homeScore;

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
                'date' => $recentMatch->match_date->toDateString(),
                'result' => $resultString,
                'outcome' => $outcome,
                'venue' => $isHome ? 'home' : 'away',
                'opponent' => $isHome ? $recentMatch->away_team : $recentMatch->home_team,
                'goals_scored' => $teamScore,
                'goals_conceded' => $opponentScore,
            ];
        }

        // Calculate averages
        $avgGoalsScored = $matchesPlayed > 0 ? round($goalsScored / $matchesPlayed, 2) : 0.0;
        $avgGoalsConceded = $matchesPlayed > 0 ? round($goalsConceded / $matchesPlayed, 2) : 0.0;

        // Form rating (0–10 scale)
        $formRating = 5.0;
        if ($matchesPlayed > 0) {
            $pointsPerGame = ($wins * 3 + $draws) / $matchesPlayed;
            $formRating = round(2.5 + ($pointsPerGame * 2.5), 2); // Maps 0–3 PPG to ~2.5–10
        }

        // Momentum: compare last 3 vs previous 3
        $formMomentum = 0.0;
        if (count($rawForm) >= 6) {
            $lastThree = array_slice($rawForm, 0, 3);
            $prevThree = array_slice($rawForm, 3, 3);
            $currentPoints = $this->calculatePoints($lastThree);
            $previousPoints = $this->calculatePoints($prevThree);
            $formMomentum = round(($currentPoints - $previousPoints) / 9, 3); // -1 to +1
        } elseif (count($rawForm) >= 3) {
            $formMomentum = round($this->calculatePoints(array_slice($rawForm, 0, 3)) / 9, 3);
        }

        // Form string (last 5 results)
        $formString = collect(array_slice($rawForm, 0, 5))
            ->pluck('outcome')
            ->implode('');

        // Update or create team form
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
                'avg_goals_scored' => $avgGoalsScored,
                'avg_goals_conceded' => $avgGoalsConceded,
                'form_rating' => $formRating,
                'form_momentum' => $formMomentum,
                'clean_sheets' => $cleanSheets,
                'failed_to_score' => $failedToScore,
                'form_string' => $formString,
                'win_probability' => $matchesPlayed > 0 ? round($wins / $matchesPlayed, 3) : 0.333,
                'draw_probability' => $matchesPlayed > 0 ? round($draws / $matchesPlayed, 3) : 0.333,
                'loss_probability' => $matchesPlayed > 0 ? round($losses / $matchesPlayed, 3) : 0.334,
            ]
        );

        Log::debug('Team form updated', [
            'team_code' => $team->code,
            'venue' => $venue,
            'form_rating' => $formRating,
            'form_momentum' => $formMomentum,
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
            }
        }
        return $points;
    }

    /**
     * Process head-to-head analysis using team IDs
     */
// Inside processHeadToHead() — replace the entire historicalMatches query and loop

protected function processHeadToHead(MatchModel $match)
{
Log::info('Processing head-to-head analysis', [
'match_id' => $match->id,
'home_team' => $match->home_team,
'away_team' => $match->away_team,
]);

$homeTeamId = $match->home_team_id;
$awayTeamId = $match->away_team_id;

// Find historical completed matches between these two teams
$historicalMatches = MatchModel::where(function ($query) use ($homeTeamId, $awayTeamId) {
$query->where('home_team_id', $homeTeamId)
->where('away_team_id', $awayTeamId);
})->orWhere(function ($query) use ($homeTeamId, $awayTeamId) {
$query->where('home_team_id', $awayTeamId)
->where('away_team_id', $homeTeamId);
})
->where('id', '!=', $match->id)
->whereNotNull('home_score') // ← Fixed: check actual score columns
->whereNotNull('away_score') // ← Fixed
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
$isCurrentHomeAsHome = $historical->home_team_id === $homeTeamId;

$homeScore = (int) $historical->home_score;
$awayScore = (int) $historical->away_score;

$resultString = "{$homeScore}-{$awayScore}";

if ($homeScore > $awayScore) {
$isCurrentHomeAsHome ? $homeWins++ : $awayWins++;
} elseif ($homeScore < $awayScore) { $isCurrentHomeAsHome ? $awayWins++ : $homeWins++; } else { $draws++; } if
    ($isCurrentHomeAsHome) { $homeGoals +=$homeScore; $awayGoals +=$awayScore; } else { $homeGoals +=$awayScore;
    $awayGoals +=$homeScore; } $lastMeetings[]=[ 'date'=> $historical->match_date->toDateString(),
    'result' => $this->determineResultFromScores($homeScore, $awayScore, $isCurrentHomeAsHome),
    'score' => $resultString,
    'venue' => $isCurrentHomeAsHome ? 'home' : 'away',
    'home_team' => $historical->home_team,
    'away_team' => $historical->away_team,
    ];
    }

    $total = $homeWins + $awayWins + $draws;

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
    'last_meeting_date' => $lastMeetings[0]['date'] ?? null,
    'last_meeting_result' => $lastMeetings[0]['result'] ?? null,
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
    ]);
    }

    // Add this helper method to determine result from scores
    protected function determineResultFromScores(int $homeScore, int $awayScore, bool $isCurrentHomeAsHome): string
    {
    if ($isCurrentHomeAsHome) {
    return $homeScore > $awayScore ? 'home' : ($homeScore < $awayScore ? 'away' : 'draw' ); } else { return $awayScore>
        $homeScore ? 'home' : ($awayScore < $homeScore ? 'away' : 'draw' ); } }


    /**
     * Process prediction generation
     */
    protected function processPrediction(MatchModel $match, PredictionService $predictionService)
    {
        Log::info('Generating prediction for match', [
            'match_id' => $match->id,
        ]);

        $result = $predictionService->generatePredictions([$match->id], $this->options);

        if (!$result['success']) {
            throw new \Exception('Failed to generate prediction: ' . ($result['error'] ?? 'Unknown error'));
        }

        Log::info('Prediction generated successfully', [
            'match_id' => $match->id,
            'method' => $result['method'] ?? 'unknown',
        ]);
    }

    /**
     * Full analysis pipeline
     */
    protected function processFullAnalysis(MatchModel $match, PredictionService $predictionService)
    {
        Log::info('Starting full analysis for match', ['match_id' => $match->id]);

        $this->processFormAnalysis($match);
        $this->processHeadToHead($match);
        $this->processPrediction($match, $predictionService);

        $match->analysis_status = 'completed';
        $match->analysis_completed_at = Carbon::now();
        $match->save();

        Log::info('Full analysis completed', ['match_id' => $match->id]);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::critical('ProcessMatchForML job failed', [
            'match_id' => $this->matchId,
            'process_type' => $this->processType,
            'error' => $exception->getMessage(),
        ]);

        $match = MatchModel::find($this->matchId);
        if ($match) {
            $match->analysis_status = 'failed';
            $match->analysis_failed_at = Carbon::now();
            $match->analysis_error = $exception->getMessage();
            $match->save();
        }
    }
}