<?php
// app/Models/TeamForm.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Team_Form extends Model
{
    use HasFactory;

    protected $table = 'team_forms';
    protected $primaryKey = 'id';

    protected $fillable = [
        'match_id',
        'team_id',
        'venue',
        'raw_form',
        'matches_played',
        'wins',
        'draws',
        'losses',
        'goals_scored',
        'goals_conceded',
        'avg_goals_scored',
        'avg_goals_conceded',
        'form_rating',
        'form_momentum',
        'clean_sheets',
        'failed_to_score',
        'form_string',
        'opponent_strength',
        'win_probability',
        'draw_probability',
        'loss_probability'
    ];

    protected $casts = [
        'raw_form' => 'array',
        'opponent_strength' => 'array',
        'form_rating' => 'float',
        'form_momentum' => 'float',
        'avg_goals_scored' => 'float',
        'avg_goals_conceded' => 'float',
        'win_probability' => 'float',
        'draw_probability' => 'float',
        'loss_probability' => 'float'
    ];

    // Relationships
    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Calculate all statistics from raw form data
     */
    public function calculateStatistics(): void
    {
        $rawForm = $this->raw_form ?? [];
        $this->matches_played = count($rawForm);

        $wins = $draws = $losses = 0;
        $goalsScored = $goalsConceded = 0;
        $cleanSheets = $failedToScore = 0;
        $formString = '';

        foreach ($rawForm as $match) {
            $result = $match['outcome'] ?? '';
            $score = explode('-', $match['result'] ?? '0-0');

            $teamScore = ($this->venue === 'home') ? (int) $score[0] : (int) $score[1];
            $opponentScore = ($this->venue === 'home') ? (int) $score[1] : (int) $score[0];

            $goalsScored += $teamScore;
            $goalsConceded += $opponentScore;

            if ($teamScore === 0)
                $failedToScore++;
            if ($opponentScore === 0)
                $cleanSheets++;

            switch ($result) {
                case 'W':
                    $wins++;
                    $formString .= 'W';
                    break;
                case 'D':
                    $draws++;
                    $formString .= 'D';
                    break;
                case 'L':
                    $losses++;
                    $formString .= 'L';
                    break;
            }
        }

        $this->wins = $wins;
        $this->draws = $draws;
        $this->losses = $losses;
        $this->goals_scored = $goalsScored;
        $this->goals_conceded = $goalsConceded;
        $this->clean_sheets = $cleanSheets;
        $this->failed_to_score = $failedToScore;
        $this->form_string = $formString;

        // Calculate averages
        $this->avg_goals_scored = $this->matches_played > 0
            ? round($goalsScored / $this->matches_played, 2)
            : 0;
        $this->avg_goals_conceded = $this->matches_played > 0
            ? round($goalsConceded / $this->matches_played, 2)
            : 0;

        // Calculate form rating (0-10 scale)
        $this->form_rating = $this->calculateFormRating();

        // Calculate form momentum (-1 to 1 scale)
        $this->form_momentum = $this->calculateMomentum();

        // Calculate probabilities
        $this->calculateProbabilities();
    }

    /**
     * Calculate form rating based on recent results
     */
    private function calculateFormRating(): float
    {
        $totalMatches = $this->matches_played;
        if ($totalMatches === 0)
            return 5.0;

        // Recent form gets higher weight
        $recentWeight = 1.5;
        $normalWeight = 1.0;
        $rating = 0;
        $totalWeight = 0;

        $rawForm = array_reverse($this->raw_form); // Start with most recent
        $matchCount = min($totalMatches, 10);

        for ($i = 0; $i < $matchCount; $i++) {
            $weight = ($i < 3) ? $recentWeight : $normalWeight;
            $result = $rawForm[$i]['outcome'] ?? '';

            switch ($result) {
                case 'W':
                    $rating += 10 * $weight;
                    break;
                case 'D':
                    $rating += 5 * $weight;
                    break;
                case 'L':
                    $rating += 0 * $weight;
                    break;
                default:
                    $rating += 5 * $weight; // Neutral for unknown
            }

            $totalWeight += $weight;
        }

        return round($rating / $totalWeight, 2);
    }

    /**
     * Calculate momentum (-1 = declining, 0 = stable, 1 = improving)
     */
    private function calculateMomentum(): float
    {
        $rawForm = $this->raw_form ?? [];
        if (count($rawForm) < 3)
            return 0;

        $lastThree = array_slice($rawForm, 0, 3);
        $previousThree = array_slice($rawForm, 3, 3);

        if (count($previousThree) < 3)
            return 0;

        $currentPoints = $this->calculatePoints($lastThree);
        $previousPoints = $this->calculatePoints($previousThree);

        $maxPossible = 9; // 3 wins = 9 points
        $momentum = ($currentPoints - $previousPoints) / $maxPossible;

        return round(max(-1, min(1, $momentum)), 2); // Clamp between -1 and 1
    }

    private function calculatePoints(array $matches): int
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
     * Calculate win/draw/loss probabilities
     */
    private function calculateProbabilities(): void
    {
        $total = $this->matches_played;

        if ($total === 0) {
            $this->win_probability = 0.33;
            $this->draw_probability = 0.33;
            $this->loss_probability = 0.34;
            return;
        }

        // Base probabilities from historical data
        $baseWin = $this->wins / $total;
        $baseDraw = $this->draws / $total;
        $baseLoss = $this->losses / $total;

        // Adjust for form momentum
        $momentumFactor = 1 + ($this->form_momentum * 0.2);
        $adjustedWin = $baseWin * $momentumFactor;

        // Normalize to ensure sum = 1
        $sum = $adjustedWin + $baseDraw + $baseLoss;

        $this->win_probability = round($adjustedWin / $sum, 4);
        $this->draw_probability = round($baseDraw / $sum, 4);
        $this->loss_probability = round($baseLoss / $sum, 4);
    }

    /**
     * Get data formatted for Python ML model
     */
    public function toMLFormat(): array
    {
        return [
            'team_id' => $this->team_id,
            'venue' => $this->venue,
            'form_metrics' => [
                'matches_played' => $this->matches_played,
                'wins' => $this->wins,
                'draws' => $this->draws,
                'losses' => $this->losses,
                'form_string' => $this->form_string,
                'form_rating' => $this->form_rating,
                'form_momentum' => $this->form_momentum
            ],
            'goal_metrics' => [
                'goals_scored' => $this->goals_scored,
                'goals_conceded' => $this->goals_conceded,
                'avg_goals_scored' => $this->avg_goals_scored,
                'avg_goals_conceded' => $this->avg_goals_conceded,
                'clean_sheets' => $this->clean_sheets,
                'failed_to_score' => $this->failed_to_score
            ],
            'probabilities' => [
                'win' => $this->win_probability,
                'draw' => $this->draw_probability,
                'loss' => $this->loss_probability
            ],
            'raw_form' => $this->raw_form // Include raw data for detailed analysis
        ];
    }

    /**
     * Get form trend (last 5 matches as array of points)
     */
    public function getFormTrend(): array
    {
        $rawForm = $this->raw_form ?? [];
        $trend = [];

        foreach (array_slice($rawForm, 0, 5) as $match) {
            switch ($match['outcome'] ?? '') {
                case 'W':
                    $trend[] = 3;
                    break;
                case 'D':
                    $trend[] = 1;
                    break;
                case 'L':
                    $trend[] = 0;
                    break;
                default:
                    $trend[] = 1; // Neutral
            }
        }

        return $trend;
    }

    /**
     * Get opponent strength analysis
     */
    public function analyzeOpponentStrength(): array
    {
        $rawForm = $this->raw_form ?? [];
        $analysis = [
            'avg_opponent_rank' => 0,
            'strong_opponents' => 0,
            'weak_opponents' => 0
        ];

        $opponentRanks = [];
        foreach ($rawForm as $match) {
            $opponent = $match['opponent'] ?? '';
            $rank = $this->getOpponentRank($opponent);
            $opponentRanks[] = $rank;

            if ($rank <= 5)
                $analysis['strong_opponents']++;
            if ($rank >= 15)
                $analysis['weak_opponents']++;
        }

        if (!empty($opponentRanks)) {
            $analysis['avg_opponent_rank'] = round(array_sum($opponentRanks) / count($opponentRanks), 2);
        }

        return $analysis;
    }

    private function getOpponentRank(string $opponent): int
    {
        // Implement your opponent ranking logic here
        // This could come from a separate table or API
        return 10; // Default rank
    }

    /**
     * Scope for getting form by venue
     */
    public function scopeByVenue($query, string $venue)
    {
        return $query->where('venue', $venue);
    }

    /**
     * Scope for getting teams with good form
     */
    public function scopeGoodForm($query, float $threshold = 6.5)
    {
        return $query->where('form_rating', '>=', $threshold);
    }

    /**
     * Scope for getting teams with improving form
     */
    public function scopeImproving($query, float $threshold = 0.2)
    {
        return $query->where('form_momentum', '>=', $threshold);
    }
}