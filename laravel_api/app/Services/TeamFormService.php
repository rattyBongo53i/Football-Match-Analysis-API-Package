<?php
// app/Services/TeamFormService.php

namespace App\Services;

use App\Models\Team;
use App\Models\MatchModel;
use App\Models\TeamForm;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class TeamFormService
{
    const FORM_MATCHES_COUNT = 5;
    const FORM_CACHE_TTL = 1800; // 30 minutes
    
    /**
     * Get comprehensive form data for a team
     */
    public function getFormData(int $teamId, string $venueType = 'all', int $matchCount = 5): array
    {
        $cacheKey = "team_form_{$teamId}_{$venueType}_{$matchCount}";
        
        return Cache::remember($cacheKey, self::FORM_CACHE_TTL, function () use ($teamId, $venueType, $matchCount) {
            $team = Team::with(['homeMatches', 'awayMatches'])->findOrFail($teamId);
            
            // Get recent matches
            $recentMatches = $this->getRecentMatches($teamId, $venueType, $matchCount);
            
            // Calculate form metrics
            $formMetrics = $this->calculateFormMetrics($recentMatches, $teamId);
            
            // Determine form momentum
            $formMomentum = $this->determineFormMomentum($recentMatches);
            
            // Generate form string
            $formString = $this->generateFormString($recentMatches, $teamId);
            
            // Calculate form rating (0-10)
            $formRating = $this->calculateFormRating($formMetrics, $formMomentum);
            
            return [
                'form_string' => $formString,
                'matches_played' => count($recentMatches),
                'wins' => $formMetrics['wins'],
                'draws' => $formMetrics['draws'],
                'losses' => $formMetrics['losses'],
                'avg_goals_scored' => $formMetrics['avg_goals_scored'],
                'avg_goals_conceded' => $formMetrics['avg_goals_conceded'],
                'form_rating' => $formRating,
                'form_momentum' => $formMomentum,
                'last_matches' => $this->formatRecentMatches($recentMatches, $teamId),
                'team' => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'venue_preference' => $this->getVenuePreference($teamId, $venueType),
                ],
            ];
        });
    }
    
    /**
     * Get recent matches for a team
     */
    protected function getRecentMatches(int $teamId, string $venueType, int $matchCount): array
    {
        $query = MatchModel::where(function($q) use ($teamId) {
            $q->where('home_team_id', $teamId)
              ->orWhere('away_team_id', $teamId);
        })
        ->where('match_date', '<', Carbon::now())
        ->where('status', 'completed')
        ->orderBy('match_date', 'desc')
        ->limit($matchCount);
        
        // Filter by venue type
        if ($venueType === 'home') {
            $query->where('home_team_id', $teamId);
        } elseif ($venueType === 'away') {
            $query->where('away_team_id', $teamId);
        }
        
        return $query->with(['homeTeam', 'awayTeam'])->get()->toArray();
    }
    
    /**
     * Calculate form metrics from recent matches
     */
    protected function calculateFormMetrics(array $matches, int $teamId): array
    {
        $wins = 0;
        $draws = 0;
        $losses = 0;
        $goalsScored = 0;
        $goalsConceded = 0;
        
        foreach ($matches as $match) {
            $isHome = $match['home_team_id'] == $teamId;
            $teamGoals = $isHome ? $match['home_goals'] : $match['away_goals'];
            $opponentGoals = $isHome ? $match['away_goals'] : $match['home_goals'];
            
            $goalsScored += $teamGoals;
            $goalsConceded += $opponentGoals;
            
            if ($teamGoals > $opponentGoals) {
                $wins++;
            } elseif ($teamGoals < $opponentGoals) {
                $losses++;
            } else {
                $draws++;
            }
        }
        
        $totalMatches = count($matches);
        
        return [
            'wins' => $wins,
            'draws' => $draws,
            'losses' => $losses,
            'avg_goals_scored' => $totalMatches > 0 ? round($goalsScored / $totalMatches, 2) : 0,
            'avg_goals_conceded' => $totalMatches > 0 ? round($goalsConceded / $totalMatches, 2) : 0,
            'goal_difference' => $goalsScored - $goalsConceded,
        ];
    }
    
    /**
     * Determine form momentum
     */
    protected function determineFormMomentum(array $matches): string
    {
        if (empty($matches)) {
            return 'neutral';
        }
        
        $recentResults = [];
        foreach ($matches as $match) {
            $recentResults[] = $match['result'] ?? 'D';
        }
        
        // Check last 3 matches
        $lastThree = array_slice($recentResults, 0, 3);
        $wins = array_count_values($lastThree)['W'] ?? 0;
        $losses = array_count_values($lastThree)['L'] ?? 0;
        
        if ($wins >= 2) return 'positive';
        if ($losses >= 2) return 'negative';
        return 'neutral';
    }
    
    /**
     * Generate form string (e.g., "WWLDD")
     */
    protected function generateFormString(array $matches, int $teamId): string
    {
        $formChars = [];
        
        foreach ($matches as $match) {
            $isHome = $match['home_team_id'] == $teamId;
            $teamGoals = $isHome ? $match['home_goals'] : $match['away_goals'];
            $opponentGoals = $isHome ? $match['away_goals'] : $match['home_goals'];
            
            if ($teamGoals > $opponentGoals) {
                $formChars[] = 'W';
            } elseif ($teamGoals < $opponentGoals) {
                $formChars[] = 'L';
            } else {
                $formChars[] = 'D';
            }
        }
        
        return implode('', $formChars);
    }
    
    /**
     * Calculate form rating (0-10)
     */
    protected function calculateFormRating(array $formMetrics, string $momentum): float
    {
        $rating = 5.0; // Base rating
        
        // Win percentage impact
        $totalMatches = $formMetrics['wins'] + $formMetrics['draws'] + $formMetrics['losses'];
        if ($totalMatches > 0) {
            $winRate = $formMetrics['wins'] / $totalMatches;
            $rating += ($winRate * 3); // Up to +3 for perfect win rate
        }
        
        // Goal difference impact
        $rating += min($formMetrics['goal_difference'] * 0.2, 1.5); // Up to +1.5
        
        // Momentum impact
        switch ($momentum) {
            case 'positive': $rating += 1.0; break;
            case 'negative': $rating -= 1.0; break;
        }
        
        return round(max(0, min(10, $rating)), 1);
    }
    
    /**
     * Get venue preference stats
     */
    protected function getVenuePreference(int $teamId, string $venueType): array
    {
        $stats = [
            'home' => ['wins' => 0, 'draws' => 0, 'losses' => 0, 'goals_for' => 0, 'goals_against' => 0],
            'away' => ['wins' => 0, 'draws' => 0, 'losses' => 0, 'goals_for' => 0, 'goals_against' => 0],
        ];
        
        $matches = MatchModel::where(function($q) use ($teamId) {
            $q->where('home_team_id', $teamId)
              ->orWhere('away_team_id', $teamId);
        })
        ->where('status', 'completed')
        ->get();
        
        foreach ($matches as $match) {
            $isHome = $match->home_team_id == $teamId;
            $venue = $isHome ? 'home' : 'away';
            
            $teamGoals = $isHome ? $match->home_goals : $match->away_goals;
            $opponentGoals = $isHome ? $match->away_goals : $match->home_goals;
            
            $stats[$venue]['goals_for'] += $teamGoals;
            $stats[$venue]['goals_against'] += $opponentGoals;
            
            if ($teamGoals > $opponentGoals) {
                $stats[$venue]['wins']++;
            } elseif ($teamGoals < $opponentGoals) {
                $stats[$venue]['losses']++;
            } else {
                $stats[$venue]['draws']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Format recent matches for output
     */
    protected function formatRecentMatches(array $matches, int $teamId): array
    {
        $formatted = [];
        
        foreach ($matches as $match) {
            $isHome = $match['home_team_id'] == $teamId;
            $teamName = $isHome ? $match['home_team']['name'] : $match['away_team']['name'];
            $opponentName = $isHome ? $match['away_team']['name'] : $match['home_team']['name'];
            $teamGoals = $isHome ? $match['home_goals'] : $match['away_goals'];
            $opponentGoals = $isHome ? $match['away_goals'] : $match['home_goals'];
            
            $formatted[] = [
                'match_id' => $match['id'],
                'date' => $match['match_date'],
                'venue' => $isHome ? 'home' : 'away',
                'result' => $teamGoals > $opponentGoals ? 'W' : ($teamGoals < $opponentGoals ? 'L' : 'D'),
                'score' => $teamGoals . '-' . $opponentGoals,
                'opponent' => $opponentName,
                'team_goals' => $teamGoals,
                'opponent_goals' => $opponentGoals,
                'is_home' => $isHome,
            ];
        }
        
        return $formatted;
    }
    
    /**
     * Get form comparison between two teams
     */
    public function compareTeamForms(int $team1Id, int $team2Id): array
    {
        $team1Form = $this->getFormData($team1Id);
        $team2Form = $this->getFormData($team2Id);
        
        return [
            'team1' => $team1Form,
            'team2' => $team2Form,
            'comparison' => [
                'form_rating_difference' => $team1Form['form_rating'] - $team2Form['form_rating'],
                'momentum_advantage' => $this->getMomentumAdvantage($team1Form['form_momentum'], $team2Form['form_momentum']),
                'predicted_advantage' => $this->calculateFormAdvantage($team1Form, $team2Form),
            ],
        ];
    }
    
    /**
     * Get momentum advantage
     */
    protected function getMomentumAdvantage(string $momentum1, string $momentum2): string
    {
        $momentumStrength = ['negative' => 0, 'neutral' => 1, 'positive' => 2];
        
        if ($momentumStrength[$momentum1] > $momentumStrength[$momentum2]) {
            return 'team1';
        } elseif ($momentumStrength[$momentum1] < $momentumStrength[$momentum2]) {
            return 'team2';
        }
        
        return 'equal';
    }
    
    /**
     * Calculate form advantage
     */
    protected function calculateFormAdvantage(array $form1, array $form2): float
    {
        $advantage = 0;
        
        // Form rating difference (weighted)
        $advantage += ($form1['form_rating'] - $form2['form_rating']) * 0.3;
        
        // Goal difference per match
        $advantage += (($form1['avg_goals_scored'] - $form1['avg_goals_conceded']) - 
                      ($form2['avg_goals_scored'] - $form2['avg_goals_conceded'])) * 0.2;
        
        // Win rate difference
        $winRate1 = $form1['wins'] / max(1, $form1['matches_played']);
        $winRate2 = $form2['wins'] / max(1, $form2['matches_played']);
        $advantage += ($winRate1 - $winRate2) * 0.5;
        
        return round($advantage, 2);
    }
}