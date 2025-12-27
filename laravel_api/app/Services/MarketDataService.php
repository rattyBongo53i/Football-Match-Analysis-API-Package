<?php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Market;
use App\Models\MatchMarket;
use App\Models\MatchMarketOutcome;
use App\Models\Team;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MarketDataService
{
    const MARKET_CACHE_TTL = 1800; // 30 minutes
    
    /**
     * Get market data for Python ML prediction
     */
    public function getMarketDataForPrediction(int $matchId): array
    {
        $cacheKey = "market_data_for_ml_{$matchId}";
        
        return Cache::remember($cacheKey, self::MARKET_CACHE_TTL, function () use ($matchId) {
            try {
                $match = MatchModel::with([
                    'homeTeam',
                    'awayTeam',
                    'matchMarkets.market.marketOutcomes',
                    'teamForms' => function($query) use ($matchId) {
                        $query->where('match_id', $matchId);
                    }
                ])->findOrFail($matchId);
                
                return $this->prepareMLPayload($match);
                
            } catch (\Exception $e) {
                Log::error('Failed to get market data for ML', [
                    'match_id' => $matchId,
                    'error' => $e->getMessage(),
                ]);
                
                return $this->getDefaultMarketData($matchId);
            }
        });
    }
    
    /**
     * Prepare data payload for Python ML
     */
    protected function prepareMLPayload(MatchModel $match): array
    {
        // Basic match info
        $payload = [
            'match_id' => $match->id,
            'home_team' => $match->homeTeam->name ?? $match->home_team,
            'away_team' => $match->awayTeam->name ?? $match->away_team,
            'league' => $match->league,
            'match_date' => $match->match_date->toISOString(),
            'venue' => $match->venue,
            'weather' => $match->weather_conditions,
            'referee' => $match->referee,
            'status' => $match->status,
        ];
        
        // Team data
        $payload['teams'] = [
            'home' => $this->prepareTeamData($match->homeTeam, $match, 'home'),
            'away' => $this->prepareTeamData($match->awayTeam, $match, 'away'),
        ];
        
        // Market data - YOUR ACTUAL DATABASE STRUCTURE
        $payload['markets'] = $this->prepareMarketData($match);
        
        // Form data
        $payload['team_forms'] = $this->prepareFormData($match);
        
        // Historical data
        $payload['historical'] = $this->prepareHistoricalData($match);
        
        // Prediction inputs
        $payload['prediction_inputs'] = $this->preparePredictionInputs($match);
        
        return $payload;
    }
    
    /**
     * Prepare team data for ML
     */
    protected function prepareTeamData(?Team $team, MatchModel $match, string $type): array
    {
        if (!$team) {
            return [
                'id' => null,
                'name' => $type === 'home' ? $match->home_team : $match->away_team,
                'strength_rating' => 5.0,
                'attack_rating' => 5.0,
                'defense_rating' => 5.0,
                'avg_goals_scored' => 1.2,
                'avg_goals_conceded' => 1.2,
                'form_rating' => 5.0,
                'form_string' => '',
            ];
        }
        
        return [
            'id' => $team->id,
            'name' => $team->name,
            'league' => $team->league,
            'strength_rating' => (float) ($team->strength_rating ?? 5.0),
            'attack_rating' => (float) ($team->attack_rating ?? 5.0),
            'defense_rating' => (float) ($team->defense_rating ?? 5.0),
            'avg_goals_scored' => (float) ($team->avg_goals_scored ?? 1.2),
            'avg_goals_conceded' => (float) ($team->avg_goals_conceded ?? 1.2),
            'form_rating' => (float) ($team->form_rating ?? 5.0),
            'form_string' => $team->form_string ?? '',
            'current_rank' => $team->current_rank ?? null,
        ];
    }
    
    /**
     * Prepare market data from YOUR database structure
     */
    protected function prepareMarketData(MatchModel $match): array
    {
        $marketsData = [];
        
        foreach ($match->matchMarkets as $matchMarket) {
            $market = $matchMarket->market;
            
            $marketData = [
                'match_market_id' => $matchMarket->id,
                'market_id' => $market->id,
                'market_type' => $market->market_type,
                'code' => $market->code,
                'name' => $market->name,
                'is_active' => (bool) $matchMarket->is_active,
                'outcomes' => [],
            ];
            
            // Get outcomes for this market
            foreach ($market->marketOutcomes as $outcome) {
                $matchMarketOutcome = MatchMarketOutcome::where('match_market_id', $matchMarket->id)
                    ->where('outcome_key', $outcome->outcome_key)
                    ->first();
                
                if ($matchMarketOutcome) {
                    $marketData['outcomes'][] = [
                        'outcome_key' => $outcome->outcome_key,
                        'label' => $matchMarketOutcome->label,
                        'odds' => (float) $matchMarketOutcome->odds,
                        'is_default' => (bool) $matchMarketOutcome->is_default,
                        'sort_order' => (int) $matchMarketOutcome->sort_order,
                    ];
                }
            }
            
            $marketsData[] = $marketData;
        }
        
        return $marketsData;
    }
    
    /**
     * Prepare team form data
     */
    protected function prepareFormData(MatchModel $match): array
    {
        $forms = [];
        
        foreach ($match->teamForms as $form) {
            $forms[$form->venue] = [
                'team_id' => $form->team_id,
                'venue' => $form->venue,
                'raw_form' => $form->raw_form ?? [],
                'matches_played' => (int) $form->matches_played,
                'wins' => (int) $form->wins,
                'draws' => (int) $form->draws,
                'losses' => (int) $form->losses,
                'goals_scored' => (int) $form->goals_scored,
                'goals_conceded' => (int) $form->goals_conceded,
                'avg_goals_scored' => (float) $form->avg_goals_scored,
                'avg_goals_conceded' => (float) $form->avg_goals_conceded,
                'clean_sheets' => (int) $form->clean_sheets,
                'failed_to_score' => (int) $form->failed_to_score,
                'form_string' => $form->form_string,
                'form_rating' => (float) $form->form_rating,
                'form_momentum' => (float) $form->form_momentum,
                'calculated_at' => $form->calculated_at,
            ];
        }
        
        // Ensure both forms exist
        if (!isset($forms['home'])) {
            $forms['home'] = $this->getDefaultFormData($match->homeTeam, 'home');
        }
        
        if (!isset($forms['away'])) {
            $forms['away'] = $this->getDefaultFormData($match->awayTeam, 'away');
        }
        
        return $forms;
    }
    
    /**
     * Get default form data
     */
    protected function getDefaultFormData(?Team $team, string $venue): array
    {
        return [
            'team_id' => $team->id ?? null,
            'venue' => $venue,
            'raw_form' => [],
            'matches_played' => 0,
            'wins' => 0,
            'draws' => 0,
            'losses' => 0,
            'goals_scored' => 0,
            'goals_conceded' => 0,
            'avg_goals_scored' => 0.0,
            'avg_goals_conceded' => 0.0,
            'clean_sheets' => 0,
            'failed_to_score' => 0,
            'form_string' => '',
            'form_rating' => 5.0,
            'form_momentum' => 0.0,
            'calculated_at' => now()->toISOString(),
        ];
    }
    
    /**
     * Prepare historical data (head-to-head)
     */
    protected function prepareHistoricalData(MatchModel $match): array
    {
        $historical = [
            'total_meetings' => 0,
            'home_wins' => 0,
            'away_wins' => 0,
            'draws' => 0,
            'total_goals' => 0,
            'avg_goals_per_match' => 0.0,
            'last_meetings' => [],
        ];
        
        $lastMeetings = $match->historicalResults()
            ->orderBy('match_date', 'desc')
            ->limit(10)
            ->get();
        
        foreach ($lastMeetings as $meeting) {
            $historical['last_meetings'][] = [
                'home_team' => $meeting->home_team,
                'away_team' => $meeting->away_team,
                'home_score' => (int) $meeting->home_score,
                'away_score' => (int) $meeting->away_score,
                'match_date' => $meeting->match_date,
            ];
            
            // Update statistics
            $historical['total_meetings']++;
            $historical['total_goals'] += $meeting->home_score + $meeting->away_score;
            
            if ($meeting->home_score > $meeting->away_score) {
                $historical['home_wins']++;
            } elseif ($meeting->away_score > $meeting->home_score) {
                $historical['away_wins']++;
            } else {
                $historical['draws']++;
            }
        }
        
        if ($historical['total_meetings'] > 0) {
            $historical['avg_goals_per_match'] = 
                round($historical['total_goals'] / $historical['total_meetings'], 2);
        }
        
        return $historical;
    }
    
    /**
     * Prepare prediction inputs for ML
     */
    protected function preparePredictionInputs(MatchModel $match): array
    {
        return [
            // Form-based inputs
            'home_form_rating' => (float) ($match->homeTeam->form_rating ?? 5.0),
            'away_form_rating' => (float) ($match->awayTeam->form_rating ?? 5.0),
            'form_differential' => (($match->homeTeam->form_rating ?? 5.0) - ($match->awayTeam->form_rating ?? 5.0)),
            
            // Strength-based inputs
            'home_strength' => (float) ($match->homeTeam->strength_rating ?? 5.0),
            'away_strength' => (float) ($match->awayTeam->strength_rating ?? 5.0),
            'strength_differential' => (($match->homeTeam->strength_rating ?? 5.0) - ($match->awayTeam->strength_rating ?? 5.0)),
            
            // Attack/defense
            'home_attack' => (float) ($match->homeTeam->attack_rating ?? 5.0),
            'away_attack' => (float) ($match->awayTeam->attack_rating ?? 5.0),
            'home_defense' => (float) ($match->homeTeam->defense_rating ?? 5.0),
            'away_defense' => (float) ($match->awayTeam->defense_rating ?? 5.0),
            
            // Goal statistics
            'home_avg_goals_scored' => (float) ($match->homeTeam->avg_goals_scored ?? 1.2),
            'away_avg_goals_scored' => (float) ($match->awayTeam->avg_goals_scored ?? 1.2),
            'home_avg_goals_conceded' => (float) ($match->homeTeam->avg_goals_conceded ?? 1.2),
            'away_avg_goals_conceded' => (float) ($match->awayTeam->avg_goals_conceded ?? 1.2),
            
            // External factors (simplified)
            'venue_factor' => $this->calculateVenueFactor($match->venue, $match->homeTeam),
            'weather_factor' => $this->calculateWeatherFactor($match->weather_conditions),
            'match_importance' => $this->calculateMatchImportance($match),
            
            // Market-based inputs
            'market_volatility' => $this->calculateMarketVolatility($match->id),
            'odds_range' => $this->calculateOddsRange($match),
        ];
    }
    
    /**
     * Calculate venue factor (simplified)
     */
protected function calculateVenueFactor(?string $venue, ?Team $homeTeam): float
{
    if (!$venue || !$homeTeam) {
        return 0.5;
    }
    
    $venueLower = strtolower($venue);
    $teamNameLower = strtolower($homeTeam->name);
    
    // Simple check: if venue contains team name, it's likely home stadium
    if (str_contains($venueLower, $teamNameLower)) {
        return 0.7; // Home advantage
    }
    
    // Check for stadium keywords individually
    $stadiumKeywords = ['stadium', 'arena', 'park', 'ground', 'field'];
    foreach ($stadiumKeywords as $keyword) {
        if (str_contains($venueLower, $keyword)) {
            return 0.6; // Slight home advantage
        }
    }
    
    return 0.5; // Neutral
}

        private function calculateWeatherImpactScore(string $weather): float
        {
            $weather = strtolower(trim($weather));

            $impactScores = [
                'clear' => 0.01,
                'sunny' => 0.01,
                'partly cloudy' => 0.02,
                'cloudy' => 0.03,
                'overcast' => 0.04,
                'rain' => 0.05,
                'heavy rain' => 0.07,
                'storm' => 0.10,
                'snow' => 0.08,
                'fog' => 0.06,
                'windy' => 0.04,
            ];

            foreach ($impactScores as $condition => $score) {
                if (str_contains($weather, $condition)) {
                    return $score;
                }
            }

            return 0.02; // Default
        }

    /**
     * Calculate weather factor (simplified)
     */
    protected function calculateWeatherFactor(?string $weather): float
    {
        if (!$weather || !is_string($weather)) {
            return 0.5;
        }

        $weather = strtolower(trim($weather));

        // Check for individual conditions
        if (
            str_contains($weather, 'clear') ||
            str_contains($weather, 'sunny') ||
            str_contains($weather, 'fair')
        ) {
            return 0.9; // Good conditions
        } elseif (
            str_contains($weather, 'cloudy') ||
            str_contains($weather, 'overcast')
        ) {
            return 0.7; // Average conditions
        } elseif (
            str_contains($weather, 'rain') ||
            str_contains($weather, 'snow') ||
            str_contains($weather, 'storm')
        ) {
            return 0.3; // Poor conditions
        }

        return 0.5; // Unknown
    }
    
    /**
     * Calculate match importance
     */
    protected function calculateMatchImportance(MatchModel $match): float
    {
        $importance = 0.5; // Base importance
        
        // Check if it's a derby
        $derbyPairs = [
            ['Liverpool', 'Everton'],
            ['Manchester United', 'Manchester City'],
            ['Arsenal', 'Tottenham'],
            ['Real Madrid', 'Barcelona'],
            ['AC Milan', 'Inter Milan'],
        ];
        
        foreach ($derbyPairs as $pair) {
            if (in_array($match->homeTeam->name ?? $match->home_team, $pair) && 
                in_array($match->awayTeam->name ?? $match->away_team, $pair)) {
                $importance = 0.9; // High importance for derby
                break;
            }
        }
        
        return $importance;
    }
    
    /**
     * Calculate market volatility
     */
    protected function calculateMarketVolatility(int $matchId): float
    {
        // Simplified: count of markets as proxy for volatility
        $marketCount = MatchMarket::where('match_id', $matchId)->count();
        
        if ($marketCount > 8) {
            return 0.8; // High volatility
        } elseif ($marketCount > 4) {
            return 0.6; // Medium volatility
        }
        
        return 0.4; // Low volatility
    }
    
    /**
     * Calculate odds range
     */
    protected function calculateOddsRange(MatchModel $match): array
    {
        $allOdds = [];
        
        foreach ($match->matchMarkets as $matchMarket) {
            $outcomes = MatchMarketOutcome::where('match_market_id', $matchMarket->id)->get();
            
            foreach ($outcomes as $outcome) {
                $allOdds[] = (float) $outcome->odds;
            }
        }
        
        if (empty($allOdds)) {
            return ['min' => 1.0, 'max' => 10.0, 'avg' => 3.0];
        }
        
        return [
            'min' => round(min($allOdds), 2),
            'max' => round(max($allOdds), 2),
            'avg' => round(array_sum($allOdds) / count($allOdds), 2),
        ];
    }
    
    /**
     * Get default market data when match not found
     */
    protected function getDefaultMarketData(int $matchId): array
    {
        Log::warning('Using default market data', ['match_id' => $matchId]);
        
        return [
            'match_id' => $matchId,
            'home_team' => 'Unknown',
            'away_team' => 'Unknown',
            'league' => 'Unknown',
            'match_date' => now()->toISOString(),
            'venue' => null,
            'weather' => null,
            'referee' => null,
            'status' => 'unknown',
            'teams' => [
                'home' => $this->getDefaultTeamData('home'),
                'away' => $this->getDefaultTeamData('away'),
            ],
            'markets' => [],
            'team_forms' => [
                'home' => $this->getDefaultFormData(null, 'home'),
                'away' => $this->getDefaultFormData(null, 'away'),
            ],
            'historical' => [
                'total_meetings' => 0,
                'home_wins' => 0,
                'away_wins' => 0,
                'draws' => 0,
                'total_goals' => 0,
                'avg_goals_per_match' => 0.0,
                'last_meetings' => [],
            ],
            'prediction_inputs' => [
                'home_form_rating' => 5.0,
                'away_form_rating' => 5.0,
                'form_differential' => 0.0,
                'home_strength' => 5.0,
                'away_strength' => 5.0,
                'strength_differential' => 0.0,
                'home_attack' => 5.0,
                'away_attack' => 5.0,
                'home_defense' => 5.0,
                'away_defense' => 5.0,
                'home_avg_goals_scored' => 1.2,
                'away_avg_goals_scored' => 1.2,
                'home_avg_goals_conceded' => 1.2,
                'away_avg_goals_conceded' => 1.2,
                'venue_factor' => 0.5,
                'weather_factor' => 0.5,
                'match_importance' => 0.5,
                'market_volatility' => 0.5,
                'odds_range' => ['min' => 1.0, 'max' => 10.0, 'avg' => 3.0],
            ],
        ];
    }
    
    /**
     * Get default team data
     */
    protected function getDefaultTeamData(string $type): array
    {
        return [
            'id' => null,
            'name' => "Unknown {$type}",
            'league' => 'Unknown',
            'strength_rating' => 5.0,
            'attack_rating' => 5.0,
            'defense_rating' => 5.0,
            'avg_goals_scored' => 1.2,
            'avg_goals_conceded' => 1.2,
            'form_rating' => 5.0,
            'form_string' => '',
            'current_rank' => null,
        ];
    }
    
    /**
     * Get market odds for specific selection
     */
    public function getMarketOdds(int $matchId, string $marketCode, string $outcomeKey): ?float
    {
        try {
            $matchMarket = MatchMarket::whereHas('market', function($query) use ($marketCode) {
                    $query->where('code', $marketCode);
                })
                ->where('match_id', $matchId)
                ->first();
            
            if (!$matchMarket) {
                return null;
            }
            
            $outcome = MatchMarketOutcome::where('match_market_id', $matchMarket->id)
                ->where('outcome_key', $outcomeKey)
                ->first();
            
            return $outcome ? (float) $outcome->odds : null;
            
        } catch (\Exception $e) {
            Log::error('Failed to get market odds', [
                'match_id' => $matchId,
                'market_code' => $marketCode,
                'outcome_key' => $outcomeKey,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    public function getPredictionInputs(int $matchId): array
{
    try {
        $marketData = $this->getMarketDataForPrediction($matchId);
        
        // Extract just the prediction inputs part
        return $marketData['prediction_inputs'] ?? $this->getDefaultPredictionInputs();
        
    } catch (\Exception $e) {
        Log::error('Failed to get prediction inputs', [
            'match_id' => $matchId,
            'error' => $e->getMessage(),
        ]);
        
        return $this->getDefaultPredictionInputs();
    }
}

/**
 * Get default prediction inputs
 */
protected function getDefaultPredictionInputs(): array
{
    return [
        'home_form_rating' => 5.0,
        'away_form_rating' => 5.0,
        'form_differential' => 0.0,
        'home_strength' => 5.0,
        'away_strength' => 5.0,
        'strength_differential' => 0.0,
        'home_attack' => 5.0,
        'away_attack' => 5.0,
        'home_defense' => 5.0,
        'away_defense' => 5.0,
        'home_avg_goals_scored' => 1.2,
        'away_avg_goals_scored' => 1.2,
        'home_avg_goals_conceded' => 1.2,
        'away_avg_goals_conceded' => 1.2,
        'venue_factor' => 0.5,
        'weather_factor' => 0.5,
        'match_importance' => 0.5,
        'market_volatility' => 0.5,
        'odds_range' => ['min' => 1.0, 'max' => 10.0, 'avg' => 3.0],
    ];
}

/**
 * Legacy method for compatibility with existing code
 */
public function getMatchMarkets(int $matchId): array
{
    return $this->getMarketDataForPrediction($matchId);
}

/**
 * Legacy method for compatibility
 */
public function formatMatchMarkets(MatchModel $match): array
{
    $marketData = $this->getMarketDataForPrediction($match->id);
    
    // Return a simplified format similar to the old structure
    return [
        'match_id' => $match->id,
        'home_team' => $match->homeTeam->name ?? $match->home_team,
        'away_team' => $match->awayTeam->name ?? $match->away_team,
        'league' => $match->league,
        'match_date' => $match->match_date,
        'markets' => $marketData['markets'] ?? [],
        'market_summary' => [
            'total_markets' => count($marketData['markets'] ?? []),
            'market_types' => array_unique(array_column($marketData['markets'] ?? [], 'market_type')),
        ],
    ];
}

/**
 * Get all markets for multiple matches (legacy compatibility)
 */
public function getBatchMarkets(array $matchIds): array
{
    $result = [];
    
    foreach ($matchIds as $matchId) {
        $result[$matchId] = $this->getMarketDataForPrediction($matchId);
    }
    
    return $result;
}



}