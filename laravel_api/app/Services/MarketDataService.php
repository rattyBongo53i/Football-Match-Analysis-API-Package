<?php
// app/Services/MarketDataService.php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Market;
use App\Models\Team;
use App\Models\League;
use App\Models\Weather;
use App\Models\Referee;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MarketDataService
{
    const MARKET_CACHE_TTL = 1800; // 30 minutes
    const ODDS_CACHE_TTL = 300; // 5 minutes
    
    /**
     * Get comprehensive market data for a match
     */
    public function getMatchMarkets(int $matchId): array
    {
        $cacheKey = "match_markets_{$matchId}";
        
        return Cache::remember($cacheKey, self::MARKET_CACHE_TTL, function () use ($matchId) {
            $match = MatchModel::with([
                'markets' => function($query) {
                    $query->orderBy('market_type')->orderBy('odds');
                },
                'homeTeam',
                'awayTeam',
                'league',
            ])->findOrFail($matchId);
            
            return $this->formatMatchMarkets($match);
        });
    }
    
    /**
     * Get prediction inputs for a match
     */
    public function getPredictionInputs(int $matchId): array
    {
        $cacheKey = "prediction_inputs_{$matchId}";
        
        return Cache::remember($cacheKey, self::MARKET_CACHE_TTL, function () use ($matchId) {
            $match = MatchModel::with(['homeTeam', 'awayTeam', 'venue', 'weather', 'referee'])->findOrFail($matchId);
            
            return $this->calculatePredictionInputs($match);
        });
    }
    
    /**
     * Format match markets
     */
    protected function formatMatchMarkets(MatchModel $match): array
    {
        $markets = $match->markets->groupBy('market_type');
        
        return [
            'match_id' => $match->id,
            'home_team' => $match->homeTeam->name,
            'away_team' => $match->awayTeam->name,
            'league' => $match->league->name,
            'match_date' => $match->match_date,
            'markets' => [
                '1x2' => $this->format1X2Market($markets->get('1x2', collect()), $match),
                'correct_score' => $this->formatCorrectScoreMarket($markets->get('correct_score', collect()), $match),
                'asian_handicap' => $this->formatAsianHandicapMarket($markets->get('asian_handicap', collect()), $match),
                'both_teams_to_score' => $this->formatBTTSMarket($markets->get('btts', collect()), $match),
                'over_under' => $this->formatOverUnderMarket($markets->get('over_under', collect()), $match),
                'halftime_result' => $this->formatHalftimeMarket($markets->get('ht_result', collect()), $match),
                'corners' => $this->formatCornersMarket($markets->get('corners', collect()), $match),
                'double_chance' => $this->formatDoubleChanceMarket($markets->get('double_chance', collect()), $match),
            ],
            'market_summary' => $this->generateMarketSummary($markets, $match),
            'best_value_bets' => $this->findBestValueBets($markets, $match),
            'market_volatility' => $this->calculateMarketVolatility($match->id),
        ];
    }
    
    /**
     * Format 1X2 market
     */
    protected function format1X2Market($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefault1X2Markets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'selection' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'confidence_rating' => (float) $market->confidence_rating,
                'bookmaker' => $market->bookmaker,
                'last_updated' => $market->updated_at,
            ];
        }
        
        return [
            'options' => $formatted,
            'favorite' => $this->determineFavorite($markets),
            'value_pick' => $this->findValuePick($markets),
            'market_movement' => $this->getMarketMovement($match->id, '1x2'),
        ];
    }
    
    /**
     * Generate default 1X2 markets if none exist
     */
    protected function generateDefault1X2Markets(MatchModel $match): array
    {
        // Calculate implied probabilities based on team strengths
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        $venueAdvantage = 0.1; // 10% home advantage
        
        $homeProb = ($homeStrength + $venueAdvantage) / ($homeStrength + $awayStrength + $venueAdvantage);
        $awayProb = $awayStrength / ($homeStrength + $awayStrength + $venueAdvantage);
        $drawProb = 1 - $homeProb - $awayProb;
        
        // Adjust for realistic draw probability
        $drawProb = max(0.2, min(0.35, $drawProb));
        $homeProb = ($homeProb * (1 - $drawProb)) / ($homeProb + $awayProb);
        $awayProb = 1 - $homeProb - $drawProb;
        
        // Convert to odds with bookmaker margin (5%)
        $margin = 1.05;
        $homeOdds = round(1 / ($homeProb / $margin), 2);
        $drawOdds = round(1 / ($drawProb / $margin), 2);
        $awayOdds = round(1 / ($awayProb / $margin), 2);
        
        return [
            (object) [
                'selection' => 'Home',
                'odds' => $homeOdds,
                'implied_probability' => round($homeProb, 3),
                'confidence_rating' => 7.0,
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Draw',
                'odds' => $drawOdds,
                'implied_probability' => round($drawProb, 3),
                'confidence_rating' => 6.0,
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Away',
                'odds' => $awayOdds,
                'implied_probability' => round($awayProb, 3),
                'confidence_rating' => 6.5,
                'bookmaker' => 'System',
            ],
        ];
    }
    
    /**
     * Format correct score market
     */
    protected function formatCorrectScoreMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultCorrectScoreMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'score' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'expected_occurrence' => $this->calculateExpectedOccurrence($market->selection, $match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        // Sort by probability
        usort($formatted, function($a, $b) {
            return $b['implied_probability'] <=> $a['implied_probability'];
        });
        
        return [
            'options' => $formatted,
            'most_likely' => $formatted[0] ?? null,
            'high_value' => $this->findHighValueScores($formatted),
            'goals_expectancy' => $this->calculateGoalsExpectancy($match),
        ];
    }
    
    /**
     * Calculate expected occurrence for a scoreline
     */
    protected function calculateExpectedOccurrence(string $score, MatchModel $match): float
    {
        list($homeGoals, $awayGoals) = explode('-', $score);
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        
        return $this->calculateScoreProbability((int)$homeGoals, (int)$awayGoals, $homeAvg, $awayAvg);
    }
    
    /**
     * Find high value scores
     */
    protected function findHighValueScores(array $scores): ?array
    {
        $bestValue = null;
        $bestValueScore = 0;
        
        foreach ($scores as $score) {
            $valueScore = $score['implied_probability'] * $score['odds'];
            if ($valueScore > $bestValueScore) {
                $bestValueScore = $valueScore;
                $bestValue = $score;
            }
        }
        
        return $bestValue;
    }
    
    /**
     * Calculate goals expectancy
     */
    protected function calculateGoalsExpectancy(MatchModel $match): array
    {
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        
        return [
            'home_expected' => $homeAvg,
            'away_expected' => $awayAvg,
            'total_expected' => $homeAvg + $awayAvg,
            'home_win_probability' => $this->calculateWinProbability($homeAvg, $awayAvg, true),
            'away_win_probability' => $this->calculateWinProbability($awayAvg, $homeAvg, false),
            'draw_probability' => $this->calculateDrawProbability($homeAvg, $awayAvg),
        ];
    }
    
    /**
     * Calculate win probability
     */
    protected function calculateWinProbability(float $teamAvg, float $opponentAvg, bool $isHome): float
    {
        $homeAdvantage = $isHome ? 1.1 : 0.9;
        $adjustedAvg = $teamAvg * $homeAdvantage;
        
        // Simple Poisson-based win probability
        $winProb = 0;
        for ($i = 1; $i <= 10; $i++) {
            for ($j = 0; $j < $i; $j++) {
                $teamProb = exp(-$adjustedAvg) * pow($adjustedAvg, $i) / $this->factorial($i);
                $oppProb = exp(-$opponentAvg) * pow($opponentAvg, $j) / $this->factorial($j);
                $winProb += $teamProb * $oppProb;
            }
        }
        
        return round($winProb, 3);
    }
    
    /**
     * Calculate draw probability
     */
    protected function calculateDrawProbability(float $homeAvg, float $awayAvg): float
    {
        $drawProb = 0;
        for ($i = 0; $i <= 5; $i++) {
            $homeProb = exp(-$homeAvg) * pow($homeAvg, $i) / $this->factorial($i);
            $awayProb = exp(-$awayAvg) * pow($awayAvg, $i) / $this->factorial($i);
            $drawProb += $homeProb * $awayProb;
        }
        
        return round($drawProb, 3);
    }
    
    /**
     * Generate default correct score markets
     */
    protected function generateDefaultCorrectScoreMarkets(MatchModel $match): array
    {
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        
        $commonScores = [
            '1-0', '2-0', '2-1', '1-1', '0-0', '0-1', '1-2', '0-2', '3-0', '3-1',
        ];
        
        $markets = [];
        foreach ($commonScores as $score) {
            list($homeGoals, $awayGoals) = explode('-', $score);
            $probability = $this->calculateScoreProbability($homeGoals, $awayGoals, $homeAvg, $awayAvg);
            $odds = round(1 / ($probability * 1.1), 2); // 10% margin
            
            $markets[] = (object) [
                'selection' => $score,
                'odds' => $odds,
                'implied_probability' => round($probability, 4),
                'bookmaker' => 'System',
            ];
        }
        
        return $markets;
    }
    
    /**
     * Calculate score probability using Poisson distribution
     */
    protected function calculateScoreProbability(int $homeGoals, int $awayGoals, float $homeAvg, float $awayAvg): float
    {
        // Simple Poisson probability
        $homeProb = exp(-$homeAvg) * pow($homeAvg, $homeGoals) / $this->factorial($homeGoals);
        $awayProb = exp(-$awayAvg) * pow($awayAvg, $awayGoals) / $this->factorial($awayGoals);
        
        return $homeProb * $awayProb;
    }
    
    /**
     * Factorial helper
     */
    protected function factorial(int $n): int
    {
        if ($n <= 1) return 1;
        return $n * $this->factorial($n - 1);
    }
    
    /**
     * Format Asian handicap market
     */
    protected function formatAsianHandicapMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultAsianHandicapMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'handicap' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'expected_value' => $this->calculateHandicapEV($market, $match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'recommended' => $this->recommendAsianHandicap($formatted, $match),
            'market_depth' => count($formatted),
        ];
    }
    
    /**
     * Calculate handicap expected value
     */
    protected function calculateHandicapEV($market, MatchModel $match): float
    {
        $impliedProb = $market->implied_probability;
        $estimatedProb = $this->estimateHandicapProbability($market->selection, $match);
        
        return round(($estimatedProb * $market->odds) - 1, 3);
    }
    
    /**
     * Estimate handicap probability
     */
    protected function estimateHandicapProbability(string $handicap, MatchModel $match): float
    {
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        
        preg_match('/(Home|Away)\s*([+-]?\d+(?:\.\d+)?)/', $handicap, $matches);
        
        if (count($matches) !== 3) {
            return 0.5;
        }
        
        $team = $matches[1];
        $handicapValue = (float)$matches[2];
        
        $baseProbability = 0.5;
        if ($team === 'Home') {
            $baseProbability += ($homeStrength - $awayStrength) * 0.05;
            $baseProbability -= $handicapValue * 0.1;
        } else {
            $baseProbability -= ($homeStrength - $awayStrength) * 0.05;
            $baseProbability += $handicapValue * 0.1;
        }
        
        return max(0.3, min(0.7, $baseProbability));
    }
    
    /**
     * Recommend Asian handicap
     */
    protected function recommendAsianHandicap(array $handicaps, MatchModel $match): ?array
    {
        $bestEV = -1;
        $bestHandicap = null;
        
        foreach ($handicaps as $handicap) {
            if ($handicap['expected_value'] > $bestEV) {
                $bestEV = $handicap['expected_value'];
                $bestHandicap = $handicap;
            }
        }
        
        return $bestEV > 0 ? $bestHandicap : null;
    }
    
    /**
     * Generate default Asian handicap markets
     */
    protected function generateDefaultAsianHandicapMarkets(MatchModel $match): array
    {
        $handicaps = [
            '-1.5', '-1.0', '-0.5', '+0.5', '+1.0', '+1.5'
        ];
        
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        $strengthDiff = $homeStrength - $awayStrength;
        
        $markets = [];
        foreach ($handicaps as $handicap) {
            $handicapValue = (float) str_replace(['+', '-'], '', $handicap);
            $isHome = strpos($handicap, '-') === 0;
            
            $baseProbability = 0.5;
            if ($isHome) {
                $baseProbability = 0.5 + ($strengthDiff * 0.05) - ($handicapValue * 0.1);
            } else {
                $baseProbability = 0.5 - ($strengthDiff * 0.05) - ($handicapValue * 0.1);
            }
            
            $baseProbability = max(0.3, min(0.7, $baseProbability));
            $odds = round(1 / ($baseProbability * 1.05), 2); // 5% margin
            
            $markets[] = (object) [
                'selection' => ($isHome ? 'Home ' : 'Away ') . $handicap,
                'odds' => $odds,
                'implied_probability' => round($baseProbability, 3),
                'bookmaker' => 'System',
            ];
        }
        
        return $markets;
    }
    
    /**
     * Format Both Teams To Score market
     */
    protected function formatBTTSMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultBTTSMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'selection' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'historical_probability' => $this->getHistoricalBTTSProbability($match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'recommendation' => $this->recommendBTTS($formatted, $match),
            'trend' => $this->getBTTSTrend($match),
        ];
    }
    
    /**
     * Get historical BTTS probability
     */
    protected function getHistoricalBTTSProbability(MatchModel $match): float
    {
        // In a real implementation, this would query historical data
        // For now, return a reasonable estimate
        $homeAttack = $match->homeTeam->attack_rating ?? 6.5;
        $awayAttack = $match->awayTeam->attack_rating ?? 6.0;
        
        return round(($homeAttack + $awayAttack) / 20, 3); // Scale to 0-1 range
    }
    
    /**
     * Recommend BTTS
     */
    protected function recommendBTTS(array $options, MatchModel $match): string
    {
        $bttsProb = $this->getHistoricalBTTSProbability($match);
        
        if ($bttsProb > 0.6) {
            return 'Yes';
        } elseif ($bttsProb < 0.4) {
            return 'No';
        }
        
        return 'Avoid';
    }
    
    /**
     * Get BTTS trend
     */
    protected function getBTTSTrend(MatchModel $match): string
    {
        // In a real implementation, this would analyze recent matches
        return 'neutral';
    }
    
    /**
     * Generate default BTTS markets
     */
    protected function generateDefaultBTTSMarkets(MatchModel $match): array
    {
        $homeAttack = $match->homeTeam->attack_rating ?? 6.5;
        $awayAttack = $match->awayTeam->attack_rating ?? 6.0;
        $homeDefense = $match->homeTeam->defense_rating ?? 6.0;
        $awayDefense = $match->awayTeam->defense_rating ?? 6.5;
        
        $bttsProbability = ($homeAttack * $awayAttack) / (($homeAttack * $awayAttack) + ($homeDefense * $awayDefense));
        $bttsProbability = round($bttsProbability, 3);
        
        $bttsOdds = round(1 / ($bttsProbability * 1.05), 2);
        $noBttsOdds = round(1 / ((1 - $bttsProbability) * 1.05), 2);
        
        return [
            (object) [
                'selection' => 'Yes',
                'odds' => $bttsOdds,
                'implied_probability' => $bttsProbability,
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'No',
                'odds' => $noBttsOdds,
                'implied_probability' => round(1 - $bttsProbability, 3),
                'bookmaker' => 'System',
            ],
        ];
    }
    
    /**
     * Format Over/Under market
     */
    protected function formatOverUnderMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultOverUnderMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'line' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'expected_value' => $this->calculateOverUnderEV($market, $match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'key_line' => '2.5',
            'recommendation' => $this->recommendOverUnder($formatted, $match),
            'goals_expectation' => $this->calculateTotalGoalsExpectation($match),
        ];
    }
    
    /**
     * Calculate over/under expected value
     */
    protected function calculateOverUnderEV($market, MatchModel $match): float
    {
        $impliedProb = $market->implied_probability;
        preg_match('/(Over|Under)\s*(\d+(?:\.\d+)?)/', $market->selection, $matches);
        
        if (count($matches) !== 3) {
            return 0;
        }
        
        $type = $matches[1];
        $line = (float)$matches[2];
        
        $estimatedProb = $this->estimateOverUnderProbability($type, $line, $match);
        
        return round(($estimatedProb * $market->odds) - 1, 3);
    }
    
    /**
     * Estimate over/under probability
     */
    protected function estimateOverUnderProbability(string $type, float $line, MatchModel $match): float
    {
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        $totalAvg = $homeAvg + $awayAvg;
        
        $probability = $this->calculateOverProbability($totalAvg, $line);
        
        return $type === 'Over' ? $probability : (1 - $probability);
    }
    
    /**
     * Recommend over/under
     */
    protected function recommendOverUnder(array $options, MatchModel $match): ?array
    {
        $bestEV = -1;
        $bestOption = null;
        
        foreach ($options as $option) {
            if ($option['expected_value'] > $bestEV) {
                $bestEV = $option['expected_value'];
                $bestOption = $option;
            }
        }
        
        return $bestEV > 0 ? $bestOption : null;
    }
    
    /**
     * Calculate total goals expectation
     */
    protected function calculateTotalGoalsExpectation(MatchModel $match): array
    {
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        $totalAvg = $homeAvg + $awayAvg;
        
        return [
            'expected_total' => $totalAvg,
            'over_2.5_probability' => $this->calculateOverProbability($totalAvg, 2.5),
            'over_3.5_probability' => $this->calculateOverProbability($totalAvg, 3.5),
            'most_likely_total' => round($totalAvg),
        ];
    }
    
    /**
     * Generate default Over/Under markets
     */
    protected function generateDefaultOverUnderMarkets(MatchModel $match): array
    {
        $homeAvg = $match->homeTeam->avg_goals_scored ?? 1.5;
        $awayAvg = $match->awayTeam->avg_goals_scored ?? 1.2;
        $totalAvg = $homeAvg + $awayAvg;
        
        $lines = ['2.5', '3.5'];
        $markets = [];
        
        foreach ($lines as $line) {
            $lineValue = (float) $line;
            $overProbability = $this->calculateOverProbability($totalAvg, $lineValue);
            $underProbability = 1 - $overProbability;
            
            $overOdds = round(1 / ($overProbability * 1.05), 2);
            $underOdds = round(1 / ($underProbability * 1.05), 2);
            
            $markets[] = (object) [
                'selection' => "Over $line",
                'odds' => $overOdds,
                'implied_probability' => round($overProbability, 3),
                'bookmaker' => 'System',
            ];
            
            $markets[] = (object) [
                'selection' => "Under $line",
                'odds' => $underOdds,
                'implied_probability' => round($underProbability, 3),
                'bookmaker' => 'System',
            ];
        }
        
        return $markets;
    }
    
    /**
     * Calculate over probability using Poisson
     */
    protected function calculateOverProbability(float $avgGoals, float $line): float
    {
        // Simple Poisson cumulative probability
        $underProb = 0;
        for ($i = 0; $i < $line; $i++) {
            $underProb += exp(-$avgGoals) * pow($avgGoals, $i) / $this->factorial($i);
        }
        
        return 1 - $underProb;
    }
    
    /**
     * Format halftime market
     */
    protected function formatHalftimeMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultHalftimeMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'selection' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'historical_correlation' => $this->getHalftimeFulltimeCorrelation($match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'trend' => $this->getHalftimeTrend($match),
        ];
    }
    
    /**
     * Get halftime-fulltime correlation
     */
    protected function getHalftimeFulltimeCorrelation(MatchModel $match): float
    {
        // In a real implementation, this would analyze historical data
        // For now, return a reasonable estimate
        return 0.65;
    }
    
    /**
     * Get halftime trend
     */
    protected function getHalftimeTrend(MatchModel $match): string
    {
        // In a real implementation, this would analyze recent matches
        return 'neutral';
    }
    
    /**
     * Generate default halftime markets
     */
    protected function generateDefaultHalftimeMarkets(MatchModel $match): array
    {
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        $venueAdvantage = 0.05; // 5% home advantage for halftime
        
        $homeProb = ($homeStrength + $venueAdvantage) / ($homeStrength + $awayStrength + $venueAdvantage);
        $awayProb = $awayStrength / ($homeStrength + $awayStrength + $venueAdvantage);
        $drawProb = 1 - $homeProb - $awayProb;
        
        // Adjust for realistic halftime draw probability (higher than fulltime)
        $drawProb = max(0.35, min(0.5, $drawProb));
        $homeProb = ($homeProb * (1 - $drawProb)) / ($homeProb + $awayProb);
        $awayProb = 1 - $homeProb - $drawProb;
        
        $margin = 1.05;
        $homeOdds = round(1 / ($homeProb / $margin), 2);
        $drawOdds = round(1 / ($drawProb / $margin), 2);
        $awayOdds = round(1 / ($awayProb / $margin), 2);
        
        return [
            (object) [
                'selection' => 'Home',
                'odds' => $homeOdds,
                'implied_probability' => round($homeProb, 3),
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Draw',
                'odds' => $drawOdds,
                'implied_probability' => round($drawProb, 3),
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Away',
                'odds' => $awayOdds,
                'implied_probability' => round($awayProb, 3),
                'bookmaker' => 'System',
            ],
        ];
    }
    
    /**
     * Format corners market
     */
    protected function formatCornersMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultCornersMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'type' => $market->selection_type ?? 'total',
                'line' => $market->line_value ?? '9.5',
                'selection' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'average_corners' => $this->getAverageCorners($match),
            'recommendation' => $this->recommendCornersBet($formatted, $match),
        ];
    }
    
    /**
     * Get average corners
     */
    protected function getAverageCorners(MatchModel $match): array
    {
        // In a real implementation, this would query historical data
        return [
            'home_avg' => 5.5,
            'away_avg' => 4.5,
            'total_avg' => 10.0,
            'league_avg' => 9.8,
        ];
    }
    
    /**
     * Recommend corners bet
     */
    protected function recommendCornersBet(array $options, MatchModel $match): ?array
    {
        $avgCorners = $this->getAverageCorners($match);
        
        foreach ($options as $option) {
            if ($option['type'] === 'total') {
                $line = (float)str_replace(['over_', 'under_'], '', $option['line']);
                if (($option['selection'] === 'over' && $avgCorners['total_avg'] > $line) ||
                    ($option['selection'] === 'under' && $avgCorners['total_avg'] < $line)) {
                    return $option;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Generate default corners markets
     */
    protected function generateDefaultCornersMarkets(MatchModel $match): array
    {
        $avgCorners = $this->getAverageCorners($match);
        
        $markets = [
            (object) [
                'selection_type' => 'total',
                'line_value' => '9.5',
                'selection' => 'over',
                'odds' => 1.85,
                'implied_probability' => 0.54,
                'bookmaker' => 'System',
            ],
            (object) [
                'selection_type' => 'total',
                'line_value' => '9.5',
                'selection' => 'under',
                'odds' => 1.95,
                'implied_probability' => 0.513,
                'bookmaker' => 'System',
            ],
        ];
        
        return $markets;
    }
    
    /**
     * Format double chance market
     */
    protected function formatDoubleChanceMarket($markets, MatchModel $match): array
    {
        if ($markets->isEmpty()) {
            $markets = $this->generateDefaultDoubleChanceMarkets($match);
        }
        
        $formatted = [];
        foreach ($markets as $market) {
            $formatted[] = [
                'selection' => $market->selection,
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
                'safety_rating' => $this->calculateSafetyRating($market->selection, $match),
                'bookmaker' => $market->bookmaker,
            ];
        }
        
        return [
            'options' => $formatted,
            'safest_bet' => $this->findSafestDoubleChance($formatted),
        ];
    }
    
    /**
     * Calculate safety rating
     */
    protected function calculateSafetyRating(string $selection, MatchModel $match): float
    {
        $selections = explode(' or ', $selection);
        $totalProbability = 0;
        
        foreach ($selections as $singleSelection) {
            $totalProbability += $this->estimateTrueProbability($singleSelection);
        }
        
        return round($totalProbability, 3);
    }
    
    /**
     * Find safest double chance
     */
    protected function findSafestDoubleChance(array $options): ?array
    {
        $safest = null;
        $highestSafety = 0;
        
        foreach ($options as $option) {
            if ($option['safety_rating'] > $highestSafety) {
                $highestSafety = $option['safety_rating'];
                $safest = $option;
            }
        }
        
        return $safest;
    }
    
    /**
     * Generate default double chance markets
     */
    protected function generateDefaultDoubleChanceMarkets(MatchModel $match): array
    {
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        
        $homeProb = $homeStrength / ($homeStrength + $awayStrength);
        $awayProb = $awayStrength / ($homeStrength + $awayStrength);
        $drawProb = 0.25; // Typical draw probability
        
        // Double chance probabilities
        $homeOrDraw = $homeProb + $drawProb;
        $homeOrAway = $homeProb + $awayProb;
        $drawOrAway = $drawProb + $awayProb;
        
        $margin = 1.05;
        
        return [
            (object) [
                'selection' => 'Home or Draw',
                'odds' => round(1 / ($homeOrDraw / $margin), 2),
                'implied_probability' => round($homeOrDraw, 3),
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Home or Away',
                'odds' => round(1 / ($homeOrAway / $margin), 2),
                'implied_probability' => round($homeOrAway, 3),
                'bookmaker' => 'System',
            ],
            (object) [
                'selection' => 'Draw or Away',
                'odds' => round(1 / ($drawOrAway / $margin), 2),
                'implied_probability' => round($drawOrAway, 3),
                'bookmaker' => 'System',
            ],
        ];
    }
    
    /**
     * Calculate prediction inputs
     */
    protected function calculatePredictionInputs(MatchModel $match): array
    {
        $homeTeam = $match->homeTeam;
        $awayTeam = $match->awayTeam;
        
        // Get form data
        $homeFormRating = $homeTeam->form_rating ?? 6.5;
        $awayFormRating = $awayTeam->form_rating ?? 6.0;
        
        // Calculate weights
        $formWeightDiff = $homeFormRating - $awayFormRating;
        $homeFormWeight = 0.35 + ($formWeightDiff * 0.05);
        $awayFormWeight = 0.25 - ($formWeightDiff * 0.05);
        
        // H2H weight
        $h2hWeight = 0.15;
        
        // Venue advantage
        $venueAdvantage = $match->venue->advantage_factor ?? 0.70;
        
        // Weather impact
        $weatherImpact = $match->weather ? $this->calculateWeatherImpactScore($match->weather) : 0.02;
        
        // Referee bias
        $refereeBias = $match->referee ? $this->calculateRefereeBias($match->referee, $homeTeam, $awayTeam) : 0.01;
        
        // Expected goals
        $homeXG = $this->calculateExpectedGoals($homeTeam, $awayTeam, true);
        $awayXG = $this->calculateExpectedGoals($awayTeam, $homeTeam, false);
        $expectedGoals = $homeXG + $awayXG;
        
        // Volatility score
        $volatilityScore = $this->calculateVolatilityScore($match);
        
        return [
            'home_form_weight' => round($homeFormWeight, 2),
            'away_form_weight' => round($awayFormWeight, 2),
            'h2h_weight' => round($h2hWeight, 2),
            'venue_advantage' => round($venueAdvantage, 2),
            'weather_impact' => round($weatherImpact, 3),
            'referee_bias' => round($refereeBias, 3),
            'expected_goals' => round($expectedGoals, 2),
            'home_xg' => round($homeXG, 2),
            'away_xg' => round($awayXG, 2),
            'volatility_score' => round($volatilityScore, 1),
            'prediction_confidence' => $this->calculatePredictionConfidence($match),
            'risk_factor' => $this->calculateRiskFactor($match),
        ];
    }
    
    /**
     * Calculate weather impact score
     */
    protected function calculateWeatherImpactScore($weather): float
    {
        if (!$weather) {
            return 0.02;
        }
        
        $impact = 0;
        
        // Temperature impact
        $temp = $weather->temperature ?? 15.0;
        if ($temp < 5 || $temp > 30) $impact += 0.03;
        elseif ($temp < 10 || $temp > 25) $impact += 0.02;
        elseif ($temp < 15 || $temp > 20) $impact += 0.01;
        
        // Wind impact
        $wind = $weather->wind_speed ?? 10.0;
        if ($wind > 25) $impact += 0.03;
        elseif ($wind > 15) $impact += 0.02;
        elseif ($wind > 10) $impact += 0.01;
        
        // Condition impact
        $condition = $weather->condition ?? 'clear';
        if (in_array($condition, ['heavy_rain', 'rain', 'snow', 'thunderstorm'])) {
            $impact += 0.03;
        } elseif (in_array($condition, ['light_rain', 'fog', 'mist'])) {
            $impact += 0.02;
        } elseif ($condition === 'cloudy') {
            $impact += 0.01;
        }
        
        return round($impact, 3);
    }
    
    /**
     * Calculate referee bias
     */
    protected function calculateRefereeBias(Referee $referee, Team $homeTeam, Team $awayTeam): float
    {
        // In a real implementation, this would analyze historical referee data
        // For now, return a small random bias
        return round(mt_rand(-20, 20) / 1000, 3); // -0.02 to 0.02
    }
    
    /**
     * Calculate expected goals
     */
    protected function calculateExpectedGoals(Team $attackingTeam, Team $defendingTeam, bool $isHome): float
    {
        $attackRating = $attackingTeam->attack_rating ?? 6.5;
        $defenseRating = $defendingTeam->defense_rating ?? 6.5;
        
        $baseXG = ($attackRating / 10) * 2.5; // Max 2.5 goals
        
        if ($isHome) {
            $baseXG *= 1.1; // 10% home advantage
        } else {
            $baseXG *= 0.9; // 10% away disadvantage
        }
        
        // Adjust for defense
        $xg = $baseXG * (1 - ($defenseRating / 20)); // Defense can reduce by up to 50%
        
        return round(max(0, min(4, $xg)), 2);
    }
    
    /**
     * Calculate volatility score
     */
    protected function calculateVolatilityScore(MatchModel $match): float
    {
        $score = 0;
        
        // Team form volatility
        $homeFormConsistency = $match->homeTeam->form_consistency ?? 0.7;
        $awayFormConsistency = $match->awayTeam->form_consistency ?? 0.7;
        $score += (1 - (($homeFormConsistency + $awayFormConsistency) / 2)) * 5;
        
        // League volatility
        $leagueVolatility = $match->league->volatility_index ?? 0.5;
        $score += $leagueVolatility * 3;
        
        // Match importance
        $importance = $this->calculateMatchImportance($match);
        $score += $importance * 2;
        
        return round(min(10, $score), 1);
    }
    
    /**
     * Calculate match importance
     */
    protected function calculateMatchImportance(MatchModel $match): float
    {
        $importance = 0;
        
        // League position importance
        $homeRank = $match->homeTeam->current_rank ?? 10;
        $awayRank = $match->awayTeam->current_rank ?? 10;
        $rankDiff = abs($homeRank - $awayRank);
        $importance += ($rankDiff / 20) * 0.3;
        
        // Derby match
        $isDerby = $this->isDerbyMatch($match);
        if ($isDerby) {
            $importance += 0.4;
        }
        
        // End of season
        $seasonStage = $this->getSeasonStage($match);
        $importance += $seasonStage * 0.3;
        
        return round(min(1, $importance), 2);
    }
    
    /**
     * Check if match is a derby
     */
    protected function isDerbyMatch(MatchModel $match): bool
    {
        $derbyPairs = [
            ['Liverpool', 'Everton'],
            ['Manchester United', 'Manchester City'],
            ['Arsenal', 'Tottenham'],
            ['AC Milan', 'Inter Milan'],
            ['Real Madrid', 'Barcelona'],
        ];
        
        foreach ($derbyPairs as $pair) {
            if (in_array($match->homeTeam->name, $pair) && in_array($match->awayTeam->name, $pair)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get season stage factor
     */
    protected function getSeasonStage(MatchModel $match): float
    {
        $matchDate = $match->match_date;
        $seasonStart = Carbon::parse($match->season . '-08-01'); // August start
        $seasonEnd = Carbon::parse((intval($match->season) + 1) . '-05-31'); // May end
        
        $daysIntoSeason = $matchDate->diffInDays($seasonStart);
        $totalDays = $seasonEnd->diffInDays($seasonStart);
        
        $progress = $daysIntoSeason / $totalDays;
        
        // More important at end of season
        if ($progress > 0.8) {
            return 0.8;
        } elseif ($progress > 0.6) {
            return 0.5;
        }
        
        return 0.2;
    }
    
    /**
     * Calculate prediction confidence
     */
    protected function calculatePredictionConfidence(MatchModel $match): float
    {
        $confidence = 5.0; // Base confidence
        
        // Strength difference
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        $strengthDiff = abs($homeStrength - $awayStrength);
        $confidence += $strengthDiff * 0.5;
        
        // Form consistency
        $homeConsistency = $match->homeTeam->form_consistency ?? 0.7;
        $awayConsistency = $match->awayTeam->form_consistency ?? 0.7;
        $confidence += (($homeConsistency + $awayConsistency) / 2) * 2;
        
        return round(min(10, $confidence), 1);
    }
    
    /**
     * Calculate risk factor
     */
    protected function calculateRiskFactor(MatchModel $match): float
    {
        $risk = 5.0; // Base risk
        
        // Volatility increases risk
        $volatility = $this->calculateVolatilityScore($match);
        $risk += $volatility * 0.3;
        
        // Close match increases risk
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        $strengthDiff = abs($homeStrength - $awayStrength);
        $risk -= $strengthDiff * 0.2;
        
        return round(max(1, min(10, $risk)), 1);
    }
    
    /**
     * Helper methods for market analysis
     */
    protected function determineFavorite($markets): ?string
    {
        $lowestOdds = PHP_FLOAT_MAX;
        $favorite = null;
        
        foreach ($markets as $market) {
            if ($market->odds < $lowestOdds) {
                $lowestOdds = $market->odds;
                $favorite = $market->selection;
            }
        }
        
        return $favorite;
    }
    
    protected function findValuePick($markets): ?array
    {
        $bestValue = null;
        $bestScore = 0;
        
        foreach ($markets as $market) {
            $impliedProb = $market->implied_probability;
            $estimatedProb = $this->estimateTrueProbability($market->selection);
            
            if ($estimatedProb > $impliedProb) {
                $valueScore = ($estimatedProb - $impliedProb) * 100;
                if ($valueScore > $bestScore) {
                    $bestScore = $valueScore;
                    $bestValue = [
                        'selection' => $market->selection,
                        'odds' => $market->odds,
                        'value_score' => round($valueScore, 1),
                        'edge' => round(($estimatedProb / $impliedProb - 1) * 100, 1) . '%',
                    ];
                }
            }
        }
        
        return $bestValue;
    }
    
    protected function estimateTrueProbability(string $selection): float
    {
        $baseProbs = [
            'Home' => 0.45,
            'Draw' => 0.25,
            'Away' => 0.30,
            'Yes' => 0.55,
            'No' => 0.45,
        ];
        
        return $baseProbs[$selection] ?? 0.33;
    }
    
    /**
     * Get market movement
     */
    protected function getMarketMovement(int $matchId, string $marketType): string
    {
        // In a real implementation, this would track historical odds changes
        return 'stable';
    }
    
    /**
     * Generate market summary
     */
    protected function generateMarketSummary($markets, MatchModel $match): array
    {
        return [
            'total_markets' => $markets->flatten()->count(),
            'market_types' => $markets->keys()->toArray(),
            'average_odds' => $this->calculateAverageOdds($markets),
            'market_depth' => $this->calculateMarketDepth($markets),
            'liquidity_score' => $this->calculateLiquidityScore($match->id),
            'arbitrage_opportunities' => $this->findArbitrageOpportunities($markets),
        ];
    }
    
    /**
     * Calculate average odds
     */
    protected function calculateAverageOdds($markets): float
    {
        $totalOdds = 0;
        $count = 0;
        
        foreach ($markets as $marketGroup) {
            foreach ($marketGroup as $market) {
                $totalOdds += $market->odds;
                $count++;
            }
        }
        
        return $count > 0 ? round($totalOdds / $count, 2) : 0;
    }
    
    /**
     * Calculate market depth
     */
    protected function calculateMarketDepth($markets): int
    {
        return $markets->flatten()->count();
    }
    
    /**
     * Calculate liquidity score
     */
    protected function calculateLiquidityScore(int $matchId): float
    {
        // In a real implementation, this would analyze trading volume
        return 7.5;
    }
    
    /**
     * Find arbitrage opportunities
     */
    protected function findArbitrageOpportunities($markets): array
    {
        // In a real implementation, this would look for surebet opportunities
        return [];
    }
    
    /**
     * Find best value bets
     */
    protected function findBestValueBets($markets, MatchModel $match): array
    {
        $valueBets = [];
        
        foreach ($markets as $marketType => $marketGroup) {
            foreach ($marketGroup as $market) {
                $value = $this->calculateBetValue($market, $match);
                if ($value > 1.05) { // 5% edge
                    $valueBets[] = [
                        'market_type' => $marketType,
                        'selection' => $market->selection,
                        'odds' => $market->odds,
                        'value_score' => round($value, 2),
                        'edge' => round(($value - 1) * 100, 1) . '%',
                        'confidence' => $market->confidence_rating ?? 6.0,
                    ];
                }
            }
        }
        
        // Sort by value score
        usort($valueBets, function($a, $b) {
            return $b['value_score'] <=> $a['value_score'];
        });
        
        return array_slice($valueBets, 0, 5); // Top 5
    }
    
    /**
     * Calculate bet value
     */
    protected function calculateBetValue($market, MatchModel $match): float
    {
        $impliedProb = $market->implied_probability;
        $estimatedProb = $this->estimateSelectionProbability($market->selection, $match);
        
        return $estimatedProb / $impliedProb;
    }
    
    protected function estimateSelectionProbability(string $selection, MatchModel $match): float
    {
        // This would integrate with your full prediction model
        // For now, use simple estimates based on team strengths
        
        $homeStrength = $match->homeTeam->strength_rating ?? 6.5;
        $awayStrength = $match->awayTeam->strength_rating ?? 6.0;
        
        if (strpos($selection, 'Home') !== false) {
            return $homeStrength / ($homeStrength + $awayStrength);
        } elseif (strpos($selection, 'Away') !== false) {
            return $awayStrength / ($homeStrength + $awayStrength);
        } elseif ($selection === 'Draw') {
            return 0.25;
        } elseif ($selection === 'Yes') {
            return 0.55;
        } elseif ($selection === 'No') {
            return 0.45;
        }
        
        return 0.5;
    }
    
    /**
     * Calculate market volatility
     */
    protected function calculateMarketVolatility(int $matchId): float
    {
        // In a real implementation, this would analyze odds movements
        return 3.5;
    }
    
    /**
     * Get odds for specific market and selection
     */
    public function getOdds(int $matchId, string $marketType, string $selection): ?float
    {
        $market = Market::where('match_id', $matchId)
            ->where('market_type', $marketType)
            ->where('selection', $selection)
            ->first();
        
        return $market ? (float) $market->odds : null;
    }
    
    /**
     * Get all markets for multiple matches
     */
    public function getBatchMarkets(array $matchIds): array
    {
        $markets = Market::whereIn('match_id', $matchIds)
            ->with('match.homeTeam', 'match.awayTeam')
            ->get()
            ->groupBy('match_id');
        
        $result = [];
        foreach ($matchIds as $matchId) {
            $matchMarkets = $markets->get($matchId, collect());
            $result[$matchId] = $this->formatMatchMarketsSimple($matchMarkets);
        }
        
        return $result;
    }
    
    /**
     * Simple market formatting for batch requests
     */
    protected function formatMatchMarketsSimple($markets): array
    {
        return [
            '1x2' => $markets->where('market_type', '1x2')->values(),
            'correct_score' => $markets->where('market_type', 'correct_score')->values(),
            'asian_handicap' => $markets->where('market_type', 'asian_handicap')->values(),
            'btts' => $markets->where('market_type', 'btts')->values(),
            'over_under' => $markets->where('market_type', 'over_under')->values(),
        ];
    }
}