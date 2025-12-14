<?php
// app/Services/GeneratorService.php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\MatchModel;
use App\Models\Slip;
use App\Models\Team;

class GeneratorService
{
    protected $pythonBridge;

    public function __construct(PythonBridgeService $pythonBridge)
    {
        $this->pythonBridge = $pythonBridge;
    }

    /**
     * Generate accumulator slips from master slip
     */
    public function generateSlips(array $masterSlip, array $options = [])
    {
        try {
            Log::info('Starting slip generation', [
                'master_slip_id' => $masterSlip['id'] ?? 'unknown',
                'match_count' => count($masterSlip['matches'] ?? []),
                'options' => $options,
            ]);

            // Validate master slip
            $this->validateMasterSlip($masterSlip);

            // Get match predictions
            $matchPredictions = $this->getMatchPredictions($masterSlip['matches']);

            // Generate slip combinations
            $generatedSlips = $this->generateCombinations($masterSlip, $matchPredictions, $options);

            // Apply Monte Carlo simulation
            if (in_array('monte_carlo', $options['strategies'] ?? [])) {
                $generatedSlips = $this->applyMonteCarlo($generatedSlips, $options);
            }

            // Apply coverage optimization
            if (in_array('coverage', $options['strategies'] ?? [])) {
                $generatedSlips = $this->applyCoverageOptimization($generatedSlips, $options);
            }

            // Apply ML predictions
            if (in_array('ml_prediction', $options['strategies'] ?? [])) {
                $generatedSlips = $this->applyMLPredictions($generatedSlips, $options);
            }

            // Rank slips by expected value
            $rankedSlips = $this->rankSlips($generatedSlips, $options);

            // Limit to requested number
            $maxSlips = $options['max_slips'] ?? 100;
            $finalSlips = array_slice($rankedSlips, 0, $maxSlips);

            // Calculate statistics
            $stats = $this->calculateGenerationStats($finalSlips, $masterSlip);

            Log::info('Slip generation completed', [
                'generated_slips' => count($finalSlips),
                'total_combinations' => count($generatedSlips),
                'stats' => $stats,
            ]);

            return [
                'success' => true,
                'slips' => $finalSlips,
                'statistics' => $stats,
                'master_slip' => $masterSlip,
                'generated_at' => Carbon::now()->toISOString(),
            ];

        } catch (\Exception $e) {
            Log::error('Slip generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback_slips' => $this->generateFallbackSlips($masterSlip),
            ];
        }
    }

    /**
     * Generate predictions for matches
     */
    public function generatePredictions(array $matchIds, array $options = [])
    {
        try {
            // Use Python service for predictions
            $predictions = $this->pythonBridge->generatePredictions($matchIds, $options['model'] ?? null);

            // Update matches with predictions
            $this->updateMatchPredictions($predictions);

            return [
                'success' => true,
                'predictions' => $predictions,
                'match_count' => count($matchIds),
                'generated_at' => Carbon::now()->toISOString(),
            ];

        } catch (\Exception $e) {
            Log::error('Prediction generation failed', ['error' => $e->getMessage()]);

            // Fallback to statistical predictions
            return $this->generateStatisticalPredictions($matchIds);
        }
    }

    /**
     * Analyze team form
     */
    public function analyzeTeamForm(string $teamCode, array $options = [])
    {
        $analysis = $this->pythonBridge->analyzeTeamForm($teamCode, $options['venue'] ?? null);

        // Update team with analysis results
        $this->updateTeamFormAnalysis($teamCode, $analysis);

        return $analysis;
    }

    /**
     * Analyze head-to-head data
     */
    public function analyzeHeadToHead(int $matchId)
    {
        return $this->pythonBridge->analyzeHeadToHead($matchId);
    }

    /**
     * Calculate expected value for bets
     */
    public function calculateExpectedValue(array $betData)
    {
        $probability = $betData['probability'] ?? 0.5;
        $odds = $betData['odds'] ?? 2.0;
        $stake = $betData['stake'] ?? 1.0;

        // EV = (Probability * (Odds - 1) * Stake) - ((1 - Probability) * Stake)
        $winAmount = ($odds - 1) * $stake;
        $ev = ($probability * $winAmount) - ((1 - $probability) * $stake);

        // Calculate Kelly Criterion
        $kelly = $this->calculateKellyCriterion($probability, $odds);

        return [
            'expected_value' => round($ev, 2),
            'expected_value_percentage' => round(($ev / $stake) * 100, 2),
            'kelly_percentage' => round($kelly * 100, 2),
            'recommended_stake' => round($stake * $kelly, 2),
            'probability' => $probability,
            'odds' => $odds,
            'stake' => $stake,
        ];
    }

    /**
     * Calculate arbitrage opportunities
     */
    public function calculateArbitrage(array $oddsData)
    {
        $homeOdds = $oddsData['home'] ?? 0;
        $drawOdds = $oddsData['draw'] ?? 0;
        $awayOdds = $oddsData['away'] ?? 0;

        // Calculate implied probabilities
        $homeImplied = 1 / $homeOdds;
        $drawImplied = 1 / $drawOdds;
        $awayImplied = 1 / $awayOdds;

        $totalImplied = $homeImplied + $drawImplied + $awayImplied;

        // Calculate arbitrage percentage
        $arbitragePercentage = (1 - $totalImplied) * 100;

        // Calculate stakes for guaranteed profit
        $totalStake = 100; // Assume $100 total stake
        $homeStake = ($totalStake * $homeImplied) / $totalImplied;
        $drawStake = ($totalStake * $drawImplied) / $totalImplied;
        $awayStake = ($totalStake * $awayImplied) / $totalImplied;

        // Calculate guaranteed profit
        $homeProfit = ($homeStake * $homeOdds) - $totalStake;
        $drawProfit = ($drawStake * $drawOdds) - $totalStake;
        $awayProfit = ($awayStake * $awayOdds) - $totalStake;

        $guaranteedProfit = min($homeProfit, $drawProfit, $awayProfit);

        return [
            'arbitrage_opportunity' => $arbitragePercentage > 0,
            'arbitrage_percentage' => round($arbitragePercentage, 2),
            'total_implied_probability' => round($totalImplied * 100, 2),
            'guaranteed_profit' => round($guaranteedProfit, 2),
            'profit_percentage' => round(($guaranteedProfit / $totalStake) * 100, 2),
            'recommended_stakes' => [
                'home' => round($homeStake, 2),
                'draw' => round($drawStake, 2),
                'away' => round($awayStake, 2),
            ],
            'individual_profits' => [
                'home' => round($homeProfit, 2),
                'draw' => round($drawProfit, 2),
                'away' => round($awayProfit, 2),
            ],
        ];
    }

    /**
     * Generate handicap strategies
     */
    public function generateHandicapStrategies(array $matchData, array $options = [])
    {
        $homeStrength = $matchData['home_strength'] ?? 5.0;
        $awayStrength = $matchData['away_strength'] ?? 5.0;
        $homeForm = $matchData['home_form'] ?? 5.0;
        $awayForm = $matchData['away_form'] ?? 5.0;

        $strengthDifference = $homeStrength - $awayStrength;
        $formDifference = $homeForm - $awayForm;

        $strategies = [];

        // Asian Handicap strategies
        if (abs($strengthDifference) > 1.0) {
            $handicap = $this->calculateAsianHandicap($strengthDifference, $formDifference);

            $strategies['asian_handicap'] = [
                'recommended' => $handicap,
                'confidence' => min(0.9, 0.5 + (abs($strengthDifference) * 0.1)),
                'reasoning' => $strengthDifference > 0 ?
                    'Home team significantly stronger' :
                    'Away team significantly stronger',
            ];
        }

        // European Handicap strategies
        $europeanHandicap = $this->calculateEuropeanHandicap($strengthDifference, $formDifference);
        $strategies['european_handicap'] = $europeanHandicap;

        // Over/Under strategies based on goal expectations
        $expectedGoals = $this->calculateExpectedGoals($matchData);
        $strategies['over_under'] = $this->generateOverUnderStrategies($expectedGoals);

        // Both Teams to Score strategies
        $strategies['both_teams_score'] = $this->generateBTTSStrategies($matchData);

        // Double Chance strategies
        $strategies['double_chance'] = $this->generateDoubleChanceStrategies($matchData);

        return $strategies;
    }

    /**
     * Validate master slip
     */
    protected function validateMasterSlip(array $masterSlip)
    {
        if (empty($masterSlip['matches'])) {
            throw new \Exception('Master slip must contain matches');
        }

        if (count($masterSlip['matches']) < 2) {
            throw new \Exception('Master slip must contain at least 2 matches');
        }

        // Check if matches exist
        $matchIds = array_column($masterSlip['matches'], 'id');
        $existingMatches = MatchModel::whereIn('id', $matchIds)->count();

        if ($existingMatches !== count($matchIds)) {
            throw new \Exception('One or more matches not found');
        }

        return true;
    }

    /**
     * Get match predictions
     */
    protected function getMatchPredictions(array $matches)
    {
        $matchIds = array_column($matches, 'id');

        // Try to get existing predictions first
        $existingMatches = MatchModel::with(['prediction'])
            ->whereIn('id', $matchIds)
            ->whereNotNull('prediction')
            ->get();

        $predictions = [];

        foreach ($existingMatches as $match) {
            $predictions[$match->id] = $match->prediction;
        }

        // Generate predictions for missing matches
        $missingIds = array_diff($matchIds, array_keys($predictions));

        if (!empty($missingIds)) {
            $newPredictions = $this->pythonBridge->generatePredictions(array_values($missingIds));

            foreach ($newPredictions['predictions'] ?? [] as $prediction) {
                if (isset($prediction['match_id'])) {
                    $predictions[$prediction['match_id']] = $prediction;
                }
            }
        }

        return $predictions;
    }

    /**
     * Generate slip combinations
     */
    protected function generateCombinations(array $masterSlip, array $predictions, array $options)
    {
        $matches = $masterSlip['matches'];
        $combinations = [];

        // Generate all possible combinations (with limits)
        $maxCombinations = $options['max_combinations'] ?? 1000;
        $combinationCount = 0;

        foreach ($matches as $match) {
            $matchId = $match['id'];
            $prediction = $predictions[$matchId] ?? null;

            if (!$prediction) {
                continue;
            }

            $outcomes = $this->getPossibleOutcomes($prediction, $options);

            if (empty($combinations)) {
                // First match, initialize combinations
                foreach ($outcomes as $outcome) {
                    $combinations[] = [
                        'matches' => [
                            [
                                'match_id' => $matchId,
                                'prediction' => $outcome['prediction'],
                                'odds' => $outcome['odds'],
                                'confidence' => $outcome['confidence'],
                            ]
                        ],
                        'total_odds' => $outcome['odds'],
                        'total_confidence' => $outcome['confidence'],
                    ];
                    $combinationCount++;
                }
            } else {
                // Add match to existing combinations
                $newCombinations = [];

                foreach ($combinations as $combination) {
                    foreach ($outcomes as $outcome) {
                        if ($combinationCount >= $maxCombinations) {
                            break 2;
                        }

                        $newCombination = $combination;
                        $newCombination['matches'][] = [
                            'match_id' => $matchId,
                            'prediction' => $outcome['prediction'],
                            'odds' => $outcome['odds'],
                            'confidence' => $outcome['confidence'],
                        ];
                        $newCombination['total_odds'] *= $outcome['odds'];
                        $newCombination['total_confidence'] *= $outcome['confidence'];

                        $newCombinations[] = $newCombination;
                        $combinationCount++;
                    }
                }

                $combinations = $newCombinations;
            }

            if ($combinationCount >= $maxCombinations) {
                break;
            }
        }

        return $combinations;
    }

    /**
     * Get possible outcomes for a match
     */
    protected function getPossibleOutcomes(array $prediction, array $options)
    {
        $outcomes = [];

        // Home win
        if ($prediction['probabilities']['home'] >= 0.2) {
            $outcomes[] = [
                'prediction' => 'home',
                'odds' => $prediction['odds']['home'] ?? 2.0,
                'probability' => $prediction['probabilities']['home'],
                'confidence' => $prediction['probabilities']['home'],
            ];
        }

        // Draw
        if ($prediction['probabilities']['draw'] >= 0.2) {
            $outcomes[] = [
                'prediction' => 'draw',
                'odds' => $prediction['odds']['draw'] ?? 3.5,
                'probability' => $prediction['probabilities']['draw'],
                'confidence' => $prediction['probabilities']['draw'],
            ];
        }

        // Away win
        if ($prediction['probabilities']['away'] >= 0.2) {
            $outcomes[] = [
                'prediction' => 'away',
                'odds' => $prediction['odds']['away'] ?? 2.5,
                'probability' => $prediction['probabilities']['away'],
                'confidence' => $prediction['probabilities']['away'],
            ];
        }

        // Filter by min/max odds
        $minOdds = $options['min_odds'] ?? 1.5;
        $maxOdds = $options['max_odds'] ?? 10.0;

        return array_filter($outcomes, function ($outcome) use ($minOdds, $maxOdds) {
            return $outcome['odds'] >= $minOdds && $outcome['odds'] <= $maxOdds;
        });
    }

    /**
     * Apply Monte Carlo simulation
     */
    protected function applyMonteCarlo(array $slips, array $options)
    {
        $iterations = $options['monte_carlo_iterations'] ?? 10000;
        $riskProfile = $options['risk_profile'] ?? 'balanced';

        foreach ($slips as &$slip) {
            $totalProbability = 1.0;
            $simulatedWins = 0;

            // Simple simulation based on probabilities
            foreach ($slip['matches'] as $match) {
                $totalProbability *= $match['probability'] ?? 0.5;
            }

            // Adjust based on risk profile
            $adjustment = $this->getRiskAdjustment($riskProfile);
            $slip['monte_carlo_probability'] = $totalProbability * $adjustment;
            $slip['expected_value'] = ($slip['total_odds'] - 1) * $slip['monte_carlo_probability'];
        }

        return $slips;
    }

    /**
     * Apply coverage optimization
     */
    protected function applyCoverageOptimization(array $slips, array $options)
    {
        // Simple coverage optimization - prioritize slips with diverse outcomes
        usort($slips, function ($a, $b) {
            $aDiversity = $this->calculateDiversity($a);
            $bDiversity = $this->calculateDiversity($b);

            return $bDiversity <=> $aDiversity; // Descending
        });

        return array_slice($slips, 0, $options['max_slips'] ?? 100);
    }

    /**
     * Apply ML predictions
     */
    protected function applyMLPredictions(array $slips, array $options)
    {
        // This would integrate with ML model predictions
        // For now, use confidence-weighted ranking

        foreach ($slips as &$slip) {
            $mlScore = $slip['total_confidence'] * log($slip['total_odds']);
            $slip['ml_score'] = $mlScore;
        }

        return $slips;
    }

    /**
     * Rank slips by expected value
     */
    protected function rankSlips(array $slips, array $options)
    {
        usort($slips, function ($a, $b) use ($options) {
            $riskProfile = $options['risk_profile'] ?? 'balanced';

            switch ($riskProfile) {
                case 'conservative':
                    // Prioritize higher probability, lower odds
                    $scoreA = ($a['monte_carlo_probability'] ?? 0.5) * log(1 / $a['total_odds']);
                    $scoreB = ($b['monte_carlo_probability'] ?? 0.5) * log(1 / $b['total_odds']);
                    break;

                case 'aggressive':
                    // Prioritize higher odds, accept lower probability
                    $scoreA = ($a['total_odds'] * ($a['expected_value'] ?? 0));
                    $scoreB = ($b['total_odds'] * ($b['expected_value'] ?? 0));
                    break;

                default: // balanced
                    // Balance probability and odds
                    $scoreA = ($a['expected_value'] ?? 0) * ($a['ml_score'] ?? 1);
                    $scoreB = ($b['expected_value'] ?? 0) * ($b['ml_score'] ?? 1);
                    break;
            }

            return $scoreB <=> $scoreA; // Descending
        });

        return $slips;
    }

    /**
     * Calculate generation statistics
     */
    protected function calculateGenerationStats(array $slips, array $masterSlip)
    {
        if (empty($slips)) {
            return [];
        }

        $totalOdds = array_column($slips, 'total_odds');
        $expectedValues = array_column($slips, 'expected_value');
        $confidences = array_column($slips, 'total_confidence');

        return [
            'total_slips' => count($slips),
            'avg_odds' => round(array_sum($totalOdds) / count($totalOdds), 2),
            'max_odds' => round(max($totalOdds), 2),
            'min_odds' => round(min($totalOdds), 2),
            'avg_expected_value' => round(array_sum($expectedValues) / count($expectedValues), 4),
            'avg_confidence' => round(array_sum($confidences) / count($confidences), 3),
            'match_count' => count($masterSlip['matches']),
            'possible_combinations' => pow(3, count($masterSlip['matches'])),
        ];
    }

    /**
     * Generate fallback slips
     */
    protected function generateFallbackSlips(array $masterSlip)
    {
        // Simple fallback - generate single outcome per match with highest probability
        $slips = [];
        $totalOdds = 1.0;
        $matches = [];

        foreach ($masterSlip['matches'] as $match) {
            // Default to home win with 2.0 odds
            $matches[] = [
                'match_id' => $match['id'],
                'prediction' => 'home',
                'odds' => 2.0,
                'confidence' => 0.5,
            ];
            $totalOdds *= 2.0;
        }

        $slips[] = [
            'matches' => $matches,
            'total_odds' => $totalOdds,
            'total_confidence' => pow(0.5, count($matches)),
            'fallback' => true,
        ];

        return $slips;
    }

    /**
     * Generate statistical predictions
     */
    protected function generateStatisticalPredictions(array $matchIds)
    {
        $matches = MatchModel::with(['homeTeam', 'awayTeam'])
            ->whereIn('id', $matchIds)
            ->get();

        $predictions = [];

        foreach ($matches as $match) {
            // Simple statistical prediction based on team ratings
            $homeRating = $match->homeTeam->overall_rating ?? 5.0;
            $awayRating = $match->awayTeam->overall_rating ?? 5.0;

            $total = $homeRating + $awayRating;
            $homeProb = $homeRating / $total;
            $awayProb = $awayRating / $total;
            $drawProb = 0.3 * (1 - abs($homeProb - $awayProb));

            // Normalize
            $sum = $homeProb + $awayProb + $drawProb;
            $homeProb /= $sum;
            $awayProb /= $sum;
            $drawProb /= $sum;

            $predictions[] = [
                'match_id' => $match->id,
                'probabilities' => [
                    'home' => round($homeProb, 3),
                    'draw' => round($drawProb, 3),
                    'away' => round($awayProb, 3),
                ],
                'confidence' => 0.5,
                'method' => 'statistical_fallback',
            ];
        }

        return [
            'success' => true,
            'predictions' => $predictions,
            'method' => 'statistical_fallback',
        ];
    }

    /**
     * Update match predictions
     */
    protected function updateMatchPredictions(array $predictions)
    {
        foreach ($predictions as $prediction) {
            if (isset($prediction['match_id'])) {
                MatchModel::where('id', $prediction['match_id'])
                    ->update([
                        'prediction' => $prediction,
                        'prediction_updated_at' => Carbon::now(),
                        'prediction_method' => $prediction['method'] ?? 'python_ml',
                    ]);
            }
        }
    }

    /**
     * Update team form analysis
     */
    protected function updateTeamFormAnalysis(string $teamCode, array $analysis)
    {
        Team::where('code', $teamCode)->update([
            'form_analysis' => $analysis,
            'form_analysis_updated_at' => Carbon::now(),
        ]);
    }

    /**
     * Calculate Kelly Criterion
     */
    protected function calculateKellyCriterion(float $probability, float $odds)
    {
        if ($odds <= 1) {
            return 0;
        }

        // Kelly formula: (bp - q) / b
        // where b = odds - 1, p = probability, q = 1 - p
        $b = $odds - 1;
        $p = $probability;
        $q = 1 - $p;

        $kelly = ($b * $p - $q) / $b;

        // Conservative Kelly (half Kelly)
        return max(0, $kelly * 0.5);
    }

    /**
     * Calculate Asian Handicap
     */
    protected function calculateAsianHandicap(float $strengthDifference, float $formDifference)
    {
        $totalDifference = $strengthDifference + ($formDifference * 0.5);

        if ($totalDifference > 2.0) {
            return '-1.5';
        } elseif ($totalDifference > 1.0) {
            return '-1.0';
        } elseif ($totalDifference > 0.5) {
            return '-0.5';
        } elseif ($totalDifference < -2.0) {
            return '+1.5';
        } elseif ($totalDifference < -1.0) {
            return '+1.0';
        } elseif ($totalDifference < -0.5) {
            return '+0.5';
        } else {
            return '0.0';
        }
    }

    /**
     * Calculate European Handicap
     */
    protected function calculateEuropeanHandicap(float $strengthDifference, float $formDifference)
    {
        $totalDifference = $strengthDifference + ($formDifference * 0.3);

        if ($totalDifference > 1.5) {
            return ['home' => '-1', 'draw' => '-1', 'away' => '+1'];
        } elseif ($totalDifference > 0.8) {
            return ['home' => '-1', 'draw' => '0', 'away' => '+1'];
        } elseif ($totalDifference < -1.5) {
            return ['home' => '+1', 'draw' => '+1', 'away' => '-1'];
        } elseif ($totalDifference < -0.8) {
            return ['home' => '+1', 'draw' => '0', 'away' => '-1'];
        } else {
            return ['home' => '0', 'draw' => '0', 'away' => '0'];
        }
    }

    /**
     * Calculate expected goals
     */
    protected function calculateExpectedGoals(array $matchData)
    {
        $homeAttack = $matchData['home_attack'] ?? 5.0;
        $awayDefense = $matchData['away_defense'] ?? 5.0;
        $awayAttack = $matchData['away_attack'] ?? 5.0;
        $homeDefense = $matchData['home_defense'] ?? 5.0;

        $homeExpected = ($homeAttack / 10) * (1 - ($awayDefense / 20));
        $awayExpected = ($awayAttack / 10) * (1 - ($homeDefense / 20));

        return [
            'home' => round($homeExpected, 2),
            'away' => round($awayExpected, 2),
            'total' => round($homeExpected + $awayExpected, 2),
        ];
    }

    /**
     * Generate Over/Under strategies
     */
    protected function generateOverUnderStrategies(array $expectedGoals)
    {
        $totalGoals = $expectedGoals['total'];

        $strategies = [];

        if ($totalGoals > 3.0) {
            $strategies['over_3_5'] = ['recommended' => 'over', 'confidence' => 0.7];
            $strategies['over_2_5'] = ['recommended' => 'over', 'confidence' => 0.8];
        } elseif ($totalGoals > 2.5) {
            $strategies['over_2_5'] = ['recommended' => 'over', 'confidence' => 0.6];
        } elseif ($totalGoals < 1.5) {
            $strategies['under_2_5'] = ['recommended' => 'under', 'confidence' => 0.7];
            $strategies['under_1_5'] = ['recommended' => 'under', 'confidence' => 0.6];
        } else {
            $strategies['over_2_5'] = ['recommended' => 'under', 'confidence' => 0.55];
        }

        return $strategies;
    }

    /**
     * Generate Both Teams to Score strategies
     */
    protected function generateBTTSStrategies(array $matchData)
    {
        $homeExpected = $matchData['home_expected_goals'] ?? 1.0;
        $awayExpected = $matchData['away_expected_goals'] ?? 1.0;

        $bttsProbability = (1 - exp(-$homeExpected)) * (1 - exp(-$awayExpected));

        if ($bttsProbability > 0.6) {
            return ['recommended' => 'yes', 'confidence' => round($bttsProbability, 2)];
        } elseif ($bttsProbability < 0.4) {
            return ['recommended' => 'no', 'confidence' => round(1 - $bttsProbability, 2)];
        } else {
            return ['recommended' => 'avoid', 'confidence' => 0.5];
        }
    }

    /**
     * Generate Double Chance strategies
     */
    protected function generateDoubleChanceStrategies(array $matchData)
    {
        $homeStrength = $matchData['home_strength'] ?? 5.0;
        $awayStrength = $matchData['away_strength'] ?? 5.0;

        $difference = $homeStrength - $awayStrength;

        if ($difference > 1.0) {
            return ['recommended' => '1X', 'confidence' => 0.7];
        } elseif ($difference < -1.0) {
            return ['recommended' => 'X2', 'confidence' => 0.7];
        } else {
            return ['recommended' => '1X2', 'confidence' => 0.5];
        }
    }

    /**
     * Calculate diversity score for slip
     */
    protected function calculateDiversity(array $slip)
    {
        $predictions = array_column($slip['matches'], 'prediction');
        $predictionCounts = array_count_values($predictions);

        // More diverse = higher score
        $uniquePredictions = count($predictionCounts);
        $evenness = 0;

        if ($uniquePredictions > 1) {
            $total = count($predictions);
            foreach ($predictionCounts as $count) {
                $proportion = $count / $total;
                $evenness += $proportion * log($proportion);
            }
            $evenness = -$evenness; // Convert to positive
        }

        return $uniquePredictions + $evenness;
    }

    /**
     * Get risk adjustment factor
     */
    protected function getRiskAdjustment(string $riskProfile)
    {
        switch ($riskProfile) {
            case 'conservative':
                return 0.8;
            case 'aggressive':
                return 1.2;
            default: // balanced
                return 1.0;
        }
    }
}