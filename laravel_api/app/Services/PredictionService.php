<?php
// app/Services/PredictionService.php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\MatchModel;
use App\Models\Team;
use App\Models\Team_Form;
use App\Models\Head_To_Head;
use App\Models\Prediction;
use App\Models\MLModels;
use App\Models\Market;

class PredictionService
{
    protected $pythonBridge;
    protected $generatorService;

    public function __construct(
        PythonBridgeService $pythonBridge,
        GeneratorService $generatorService
    ) {
        $this->pythonBridge = $pythonBridge;
        $this->generatorService = $generatorService;
    }

    /**
     * Generate comprehensive predictions for matches
     */
    public function generatePredictions(array $matchIds, array $options = [])
    {
        try {
            Log::info('Starting prediction generation', [
                'match_ids' => $matchIds,
                'options' => $options,
            ]);

            // Get match data with related models
            $matches = MatchModel::with([
                'homeTeam',
                'awayTeam',
                'teamForms' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(5);
                },
                'headToHead',
                'odds'
            ])->whereIn('id', $matchIds)->get();

            if ($matches->isEmpty()) {
                throw new \Exception('No matches found for the provided IDs');
            }

            $predictions = [];
            $usePythonML = $options['use_ml'] ?? true;
            $modelName = $options['model'] ?? 'form_analysis';
            $marketName = $options['market'] ?? '1X2';

            foreach ($matches as $match) {
                if ($usePythonML) {
                    // Use Python ML service
                    $predictionData = $this->generatePythonPrediction($match, $modelName);
                } else {
                    // Use statistical model
                    $predictionData = $this->generateStatisticalPrediction($match);
                }

                // Store prediction in database
                $prediction = $this->storePrediction($match, $predictionData, $modelName, $marketName);

                // Format response
                $predictions[] = $this->formatPredictionResponse($match, $prediction, $predictionData);
            }

            // Calculate confidence metrics
            $confidenceMetrics = $this->calculateConfidenceMetrics($predictions);

            Log::info('Prediction generation completed', [
                'total_predictions' => count($predictions),
                'average_confidence' => $confidenceMetrics['average_confidence'] ?? 0,
                'method' => $usePythonML ? 'python_ml' : 'statistical',
            ]);

            return [
                'success' => true,
                'predictions' => $predictions,
                'confidence_metrics' => $confidenceMetrics,
                'generated_at' => Carbon::now()->toISOString(),
                'method' => $usePythonML ? 'python_ml' : 'statistical',
            ];

        } catch (\Exception $e) {
            Log::error('Prediction generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Fallback to simple predictions
            return $this->generateFallbackPredictions($matchIds);
        }
    }

    /**
     * Generate prediction using Python ML service
     */
    protected function generatePythonPrediction(MatchModel $match, string $modelName)
    {
        try {
            // Use Python bridge service
            $pythonResponse = $this->pythonBridge->generatePredictions(
                [$match->id],
                ['model' => $modelName]
            );

            if (isset($pythonResponse['predictions'][0])) {
                $pred = $pythonResponse['predictions'][0];
                
                // Determine outcome and probability from Python response
                if (isset($pred['probabilities']) && is_array($pred['probabilities'])) {
                    $predictionResult = $this->determineOutcomeFromProbabilities($pred['probabilities']);
                    $probability = $pred['probabilities'][$predictionResult] ?? 0.33;
                } else {
                    // Fallback if probabilities not in expected format
                    $predictionResult = $pred['prediction'] ?? 'draw';
                    $probability = $pred['confidence'] ?? 0.5;
                }
                
                $confidence = $pred['confidence'] ?? 0.5;
                
                return [
                    'predicted_outcome' => $predictionResult,
                    'probability' => $probability,
                    'confidence' => $confidence,
                    'features_used' => $this->extractFeaturesUsed($pred),
                    'raw_data' => $pred,
                    'source' => 'python_ml',
                ];
            }

        } catch (\Exception $e) {
            Log::warning('Python prediction failed, falling back to statistical', [
                'match_id' => $match->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Fallback to statistical prediction
        return $this->generateStatisticalPrediction($match);
    }

    /**
     * Generate statistical prediction
     */
    protected function generateStatisticalPrediction(MatchModel $match)
    {
        // Get form data
        $homeForm = $this->getTeamFormData($match->homeTeam, 'home', $match);
        $awayForm = $this->getTeamFormData($match->awayTeam, 'away', $match);

        // Get head-to-head data
        $h2h = $this->getHeadToHeadData($match);

        // Calculate probabilities
        $probabilities = $this->calculateProbabilities($homeForm, $awayForm, $h2h, $match->odds ?? []);

        // Determine outcome
        $predictionResult = $this->determineOutcomeFromProbabilities($probabilities);
        $probability = $probabilities[$predictionResult] ?? 0.33;
        $confidence = $this->calculateConfidence($probabilities, $homeForm, $awayForm, $h2h);

        return [
            'predicted_outcome' => $predictionResult,
            'probability' => $probability,
            'confidence' => $confidence,
            'features_used' => [
                'home_form_rating' => $homeForm['form_rating'] ?? 5.0,
                'away_form_rating' => $awayForm['form_rating'] ?? 5.0,
                'form_advantage' => ($homeForm['form_rating'] ?? 5.0) - ($awayForm['form_rating'] ?? 5.0),
                'h2h_total_meetings' => $h2h['total_meetings'] ?? 0,
                'home_advantage_factor' => 0.1,
            ],
            'raw_data' => [
                'probabilities' => $probabilities,
                'home_form' => $homeForm,
                'away_form' => $awayForm,
                'head_to_head' => $h2h,
            ],
            'source' => 'statistical',
        ];
    }

    /**
     * Get team form data
     */
    protected function getTeamFormData($team, string $venue, MatchModel $match)
    {
        if (!$team) {
            return [
                'form_rating' => 5.0,
                'form_momentum' => 0.0,
                'avg_goals_scored' => 1.2,
                'avg_goals_conceded' => 1.2,
                'matches_played' => 0,
            ];
        }

        // Get recent forms
        $recentForms = Team_Form::where('team_id', $team->code)
            ->where('venue', $venue)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        if ($recentForms->isEmpty()) {
            return [
                'form_rating' => $team->form_rating ?? 5.0,
                'form_momentum' => $team->momentum ?? 0.0,
                'avg_goals_scored' => $team->avg_goals_scored ?? 1.2,
                'avg_goals_conceded' => $team->avg_goals_conceded ?? 1.2,
                'matches_played' => 0,
            ];
        }

        // Aggregate recent forms - using your Team_Form model structure
        $aggregated = [
            'form_rating' => 0,
            'form_momentum' => 0,
            'avg_goals_scored' => 0,
            'avg_goals_conceded' => 0,
            'matches_played' => 0,
            'wins' => 0,
            'draws' => 0,
            'losses' => 0,
        ];

        foreach ($recentForms as $form) {
            $aggregated['form_rating'] += $form->form_rating ?? 5.0;
            $aggregated['form_momentum'] += $form->form_momentum ?? 0.0;
            $aggregated['avg_goals_scored'] += $form->avg_goals_scored ?? 1.2;
            $aggregated['avg_goals_conceded'] += $form->avg_goals_conceded ?? 1.2;
            $aggregated['matches_played'] += $form->matches_played ?? 0;
            $aggregated['wins'] += $form->wins ?? 0;
            $aggregated['draws'] += $form->draws ?? 0;
            $aggregated['losses'] += $form->losses ?? 0;
        }

        $count = $recentForms->count();
        
        return [
            'form_rating' => round($aggregated['form_rating'] / $count, 2),
            'form_momentum' => round($aggregated['form_momentum'] / $count, 3),
            'avg_goals_scored' => round($aggregated['avg_goals_scored'] / $count, 2),
            'avg_goals_conceded' => round($aggregated['avg_goals_conceded'] / $count, 2),
            'matches_played' => $aggregated['matches_played'],
            'win_rate' => $aggregated['matches_played'] > 0 
                ? round($aggregated['wins'] / $aggregated['matches_played'], 3) 
                : 0.33,
            'draw_rate' => $aggregated['matches_played'] > 0 
                ? round($aggregated['draws'] / $aggregated['matches_played'], 3) 
                : 0.33,
            'loss_rate' => $aggregated['matches_played'] > 0 
                ? round($aggregated['losses'] / $aggregated['matches_played'], 3) 
                : 0.33,
        ];
    }

    /**
     * Get head-to-head data - using your Head_To_Head model
     */
    protected function getHeadToHeadData(MatchModel $match)
    {
        $h2h = $match->headToHead;

        if (!$h2h) {
            return [
                'total_meetings' => 0,
                'home_wins' => 0,
                'away_wins' => 0,
                'draws' => 0,
                'home_win_rate' => 0,
                'away_win_rate' => 0,
                'draw_rate' => 0,
            ];
        }

        $total = $h2h->total_meetings;

        return [
            'total_meetings' => $total,
            'home_wins' => $h2h->home_wins,
            'away_wins' => $h2h->away_wins,
            'draws' => $h2h->draws,
            'home_win_rate' => $total > 0 
                ? round($h2h->home_wins / $total, 3) 
                : 0,
            'away_win_rate' => $total > 0 
                ? round($h2h->away_wins / $total, 3) 
                : 0,
            'draw_rate' => $total > 0 
                ? round($h2h->draws / $total, 3) 
                : 0,
        ];
    }

    /**
     * Calculate probabilities from form, h2h, and odds
     */
    protected function calculateProbabilities(array $homeForm, array $awayForm, array $h2h, array $odds)
    {
        // Step 1: Base form probabilities using Elo-like calculation
        $homeRating = $homeForm['form_rating'];
        $awayRating = $awayForm['form_rating'];
        
        $expectedHome = 1 / (1 + pow(10, ($awayRating - $homeRating) / 400));
        
        // Adjust for goal difference
        $homeGoalDiff = $homeForm['avg_goals_scored'] - $awayForm['avg_goals_conceded'];
        $awayGoalDiff = $awayForm['avg_goals_scored'] - $homeForm['avg_goals_conceded'];
        $goalFactor = ($homeGoalDiff - $awayGoalDiff) * 0.1;
        
        // Adjust for momentum
        $momentumFactor = $homeForm['form_momentum'] - $awayForm['form_momentum'];
        
        $homeProb = max(0.1, min(0.9, $expectedHome + $goalFactor + $momentumFactor * 0.05));
        
        // Draw probability based on team similarity
        $ratingDiff = abs($homeRating - $awayRating);
        $drawProb = max(0.1, min(0.4, 0.3 - ($ratingDiff * 0.05)));
        
        // Away probability
        $awayProb = max(0.1, min(0.9, 1 - $homeProb - $drawProb));

        // Step 2: Adjust for home advantage
        $homeProb += 0.1;
        $awayProb -= 0.07;
        $drawProb -= 0.03;

        // Ensure non-negative
        $homeProb = max(0.05, $homeProb);
        $awayProb = max(0.05, $awayProb);
        $drawProb = max(0.05, $drawProb);

        // Normalize
        $total = $homeProb + $drawProb + $awayProb;
        $homeProb /= $total;
        $drawProb /= $total;
        $awayProb /= $total;

        // Step 3: Incorporate head-to-head
        if ($h2h['total_meetings'] >= 3) {
            $influence = min(0.5, $h2h['total_meetings'] / 10);
            
            $homeProb = ($homeProb * (1 - $influence)) + ($h2h['home_win_rate'] * $influence);
            $drawProb = ($drawProb * (1 - $influence)) + ($h2h['draw_rate'] * $influence);
            $awayProb = ($awayProb * (1 - $influence)) + ($h2h['away_win_rate'] * $influence);
            
            // Renormalize
            $total = $homeProb + $drawProb + $awayProb;
            $homeProb /= $total;
            $drawProb /= $total;
            $awayProb /= $total;
        }

        // Step 4: Incorporate odds if available
        if (!empty($odds) && isset($odds['home']) && isset($odds['draw']) && isset($odds['away'])) {
            $impliedHome = 1 / $odds['home'];
            $impliedDraw = 1 / $odds['draw'];
            $impliedAway = 1 / $odds['away'];
            
            $totalImplied = $impliedHome + $impliedDraw + $impliedAway;
            $impliedHome /= $totalImplied;
            $impliedDraw /= $totalImplied;
            $impliedAway /= $totalImplied;
            
            // Blend 70/30 with our model
            $homeProb = ($homeProb * 0.7) + ($impliedHome * 0.3);
            $drawProb = ($drawProb * 0.7) + ($impliedDraw * 0.3);
            $awayProb = ($awayProb * 0.7) + ($impliedAway * 0.3);
            
            // Renormalize
            $total = $homeProb + $drawProb + $awayProb;
            $homeProb /= $total;
            $drawProb /= $total;
            $awayProb /= $total;
        }

        return [
            'home' => round($homeProb, 3),
            'draw' => round($drawProb, 3),
            'away' => round($awayProb, 3),
        ];
    }

    /**
     * Determine outcome from probabilities
     */
    protected function determineOutcomeFromProbabilities(array $probabilities)
    {
        if (empty($probabilities)) {
            return 'draw';
        }
        
        $maxProb = max($probabilities);
        
        if ($maxProb === $probabilities['home']) {
            return 'home';
        } elseif ($maxProb === $probabilities['away']) {
            return 'away';
        } else {
            return 'draw';
        }
    }

    /**
     * Calculate prediction confidence
     */
    protected function calculateConfidence(array $probabilities, array $homeForm, array $awayForm, array $h2h)
    {
        $maxProb = max($probabilities);
        $minProb = min($probabilities);
        
        // Base confidence from probability spread
        $probConfidence = ($maxProb - $minProb) * 2;
        
        // Form consistency factor
        $formConsistency = $this->calculateFormConsistency($homeForm, $awayForm);
        
        // Head-to-head sample size factor
        $h2hFactor = min(1.0, $h2h['total_meetings'] / 10);
        
        // Combine factors
        $confidence = ($probConfidence * 0.6) + ($formConsistency * 0.3) + ($h2hFactor * 0.1);
        
        return round(min(0.95, max(0.3, $confidence)), 3);
    }

    /**
     * Calculate form consistency
     */
    protected function calculateFormConsistency(array $homeForm, array $awayForm)
    {
        $homeMatches = $homeForm['matches_played'];
        $awayMatches = $awayForm['matches_played'];
        
        $homeConsistency = min(1.0, $homeMatches / 8);
        $awayConsistency = min(1.0, $awayMatches / 8);
        
        return ($homeConsistency + $awayConsistency) / 2;
    }

    /**
     * Store prediction in database - using your Prediction model structure
     */
    protected function storePrediction(MatchModel $match, array $predictionData, string $modelName, string $marketName)
    {
        // Get or create model
        $model = MLModels::firstOrCreate(
            ['name' => $modelName],
            ['type' => $predictionData['source'] === 'python_ml' ? 'ml' : 'statistical']
        );

        // Get market
        $market = Market::where('name', $marketName)->first();
        if (!$market) {
            $market = Market::where('name', '1X2')->first();
        }

        // Check if prediction already exists for this match, model, and market
        $existingPrediction = Prediction::where('match_id', $match->id)
            ->where('model_id', $model->id)
            ->where('market_id', $market->id)
            ->first();

        if ($existingPrediction) {
            // Update existing prediction
            $existingPrediction->update([
                'predicted_outcome' => $predictionData['predicted_outcome'],
                'probability' => $predictionData['probability'],
                'confidence' => $predictionData['confidence'],
                'features_used' => $predictionData['features_used'],
                'updated_at' => Carbon::now(),
            ]);
            
            return $existingPrediction;
        } else {
            // Create new prediction
            return Prediction::create([
                'match_id' => $match->id,
                'model_id' => $model->id,
                'market_id' => $market->id,
                'predicted_outcome' => $predictionData['predicted_outcome'],
                'probability' => $predictionData['probability'],
                'confidence' => $predictionData['confidence'],
                'features_used' => $predictionData['features_used'],
            ]);
        }
    }

    /**
     * Format prediction response
     */
    protected function formatPredictionResponse(MatchModel $match, Prediction $prediction, array $predictionData)
    {
        $model = $prediction->model;
        $market = $prediction->market;
        
        return [
            'match_id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
            'match_date' => $match->match_date,
            'prediction_id' => $prediction->id,
            'predicted_outcome' => $prediction->predicted_outcome,
            'probability' => (float)$prediction->probability,
            'confidence' => (float)$prediction->confidence,
            'model' => $model ? $model->name : 'unknown',
            'market' => $market ? $market->name : 'unknown',
            'features_used' => $prediction->features_used,
            'analysis' => $this->analyzePrediction($prediction, $match),
            'recommendations' => $this->generateRecommendations($prediction, $match),
            'risk_assessment' => $this->assessRisk($prediction, $match),
            'generated_at' => $prediction->created_at->toISOString(),
        ];
    }

    /**
     * Extract features used from Python prediction
     */
    protected function extractFeaturesUsed(array $prediction)
    {
        $features = [];
        
        if (isset($prediction['features_used'])) {
            $features = $prediction['features_used'];
        } elseif (isset($prediction['form_analysis'])) {
            $features = [
                'form_rating_home' => $prediction['form_analysis']['home_form_rating'] ?? null,
                'form_rating_away' => $prediction['form_analysis']['away_form_rating'] ?? null,
                'momentum_home' => $prediction['form_analysis']['home_momentum'] ?? null,
                'momentum_away' => $prediction['form_analysis']['away_momentum'] ?? null,
            ];
        } elseif (isset($prediction['features'])) {
            $features = $prediction['features'];
        }
        
        return $features;
    }

    /**
     * Analyze prediction for insights
     */
    protected function analyzePrediction(Prediction $prediction, MatchModel $match)
    {
        $analysis = [];
        $probability = (float)$prediction->probability;
        $confidence = (float)$prediction->confidence;

        // Strength of prediction
        if ($probability > 0.6 && $confidence > 0.7) {
            $analysis['strength'] = 'strong';
        } elseif ($probability > 0.55 && $confidence > 0.6) {
            $analysis['strength'] = 'moderate';
        } else {
            $analysis['strength'] = 'weak';
        }

        // Clear favorite analysis
        if ($probability > 0.55) {
            $analysis['clear_favorite'] = $prediction->predicted_outcome;
        } elseif ($probability < 0.4) {
            $analysis['match_type'] = 'unpredictable';
        }

        return $analysis;
    }

    /**
     * Generate betting recommendations
     */
    protected function generateRecommendations(Prediction $prediction, MatchModel $match)
    {
        $recommendations = [];
        $probability = (float)$prediction->probability;
        $confidence = (float)$prediction->confidence;

        // Main bet recommendation
        if ($confidence > 0.7 && $probability > 0.6) {
            $recommendations['main_bet'] = [
                'type' => '1x2',
                'prediction' => $prediction->predicted_outcome,
                'confidence' => 'high',
                'suggestion' => 'consider',
                'max_stake_percentage' => 5,
            ];
        } elseif ($confidence > 0.6 && $probability > 0.55) {
            $recommendations['main_bet'] = [
                'type' => '1x2',
                'prediction' => $prediction->predicted_outcome,
                'confidence' => 'medium',
                'suggestion' => 'small_stakes',
                'max_stake_percentage' => 3,
            ];
        } else {
            $recommendations['main_bet'] = [
                'type' => 'avoid',
                'confidence' => 'low',
                'suggestion' => 'skip_or_very_small',
                'max_stake_percentage' => 1,
            ];
        }

        return $recommendations;
    }

    /**
     * Assess risk level
     */
    protected function assessRisk(Prediction $prediction, MatchModel $match)
    {
        $confidence = (float)$prediction->confidence;
        $probability = (float)$prediction->probability;

        $riskLevel = 'medium';
        $riskScore = 50;

        if ($confidence > 0.75 && $probability > 0.6) {
            $riskLevel = 'low';
            $riskScore = 25;
        } elseif ($confidence < 0.55 || $probability < 0.45) {
            $riskLevel = 'high';
            $riskScore = 75;
        }

        // Adjust for match importance
        if ($match->importance === 'high') {
            $riskScore += 10;
            $riskLevel = $riskScore > 60 ? 'high' : ($riskScore > 40 ? 'medium' : 'low');
        }

        return [
            'level' => $riskLevel,
            'score' => $riskScore,
            'max_stake_percentage' => $this->calculateMaxStake($riskLevel),
        ];
    }

    /**
     * Calculate maximum stake percentage based on risk
     */
    protected function calculateMaxStake(string $riskLevel)
    {
        switch ($riskLevel) {
            case 'low':
                return 5;
            case 'medium':
                return 3;
            case 'high':
                return 1;
            default:
                return 2;
        }
    }

    /**
     * Calculate confidence metrics for all predictions
     */
    protected function calculateConfidenceMetrics(array $predictions)
    {
        if (empty($predictions)) {
            return [];
        }

        $confidences = array_column($predictions, 'confidence');
        $probabilities = array_column($predictions, 'probability');

        return [
            'average_confidence' => round(array_sum($confidences) / count($confidences), 3),
            'min_confidence' => round(min($confidences), 3),
            'max_confidence' => round(max($confidences), 3),
            'average_probability' => round(array_sum($probabilities) / count($probabilities), 3),
            'high_confidence_predictions' => count(array_filter($confidences, function($c) {
                return $c >= 0.7;
            })),
            'low_confidence_predictions' => count(array_filter($confidences, function($c) {
                return $c < 0.55;
            })),
        ];
    }

    /**
     * Generate fallback predictions
     */
    protected function generateFallbackPredictions(array $matchIds)
    {
        $predictions = [];

        // Get statistical model
        $model = MLModels::where('name', 'statistical')->first();
        if (!$model) {
            $model = MLModels::create([
                'name' => 'statistical',
                'type' => 'statistical',
                'description' => 'Statistical fallback model',
            ]);
        }

        // Get 1X2 market
        $market = Market::where('name', '1X2')->first();
        if (!$market) {
            $market = Market::create([
                'name' => '1X2',
                'category' => 'match_result',
                'code' => '1X2',
                'description' => 'Home win, Draw, Away win',
                'is_active' => true,
            ]);
        }

        foreach ($matchIds as $matchId) {
            $match = MatchModel::find($matchId);
            
            if ($match) {
                $prediction = Prediction::create([
                    'match_id' => $matchId,
                    'model_id' => $model->id,
                    'market_id' => $market->id,
                    'predicted_outcome' => 'draw',
                    'probability' => 0.33,
                    'confidence' => 0.5,
                    'features_used' => ['fallback' => true],
                ]);

                $predictions[] = [
                    'match_id' => $matchId,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'predicted_outcome' => 'draw',
                    'probability' => 0.33,
                    'confidence' => 0.5,
                    'model' => 'statistical',
                    'market' => '1X2',
                    'warning' => 'Fallback prediction due to system error',
                ];
            }
        }

        return [
            'success' => true,
            'predictions' => $predictions,
            'warning' => 'Using fallback predictions due to system error',
            'generated_at' => Carbon::now()->toISOString(),
        ];
    }

    /**
     * Get historical accuracy of predictions
     */
    public function getAccuracyStats(array $filters = [])
    {
        $query = DB::table('predictions')
            ->join('matches', 'predictions.match_id', '=', 'matches.id')
            ->whereNotNull('matches.result')
            ->whereNotNull('predictions.predicted_outcome');

        // Apply filters
        if (!empty($filters['start_date'])) {
            $query->where('matches.match_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('matches.match_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['model_id'])) {
            $query->where('predictions.model_id', $filters['model_id']);
        }

        if (!empty($filters['market_id'])) {
            $query->where('predictions.market_id', $filters['market_id']);
        }

        $predictions = $query->select(
            'predictions.id',
            'predictions.predicted_outcome',
            'predictions.confidence',
            'predictions.model_id',
            'predictions.market_id',
            'matches.result',
            'matches.match_date'
        )->get();

        if ($predictions->isEmpty()) {
            return [
                'total_predictions' => 0,
                'accuracy' => 0,
                'confidence_based_accuracy' => [],
            ];
        }

        $total = $predictions->count();
        $correct = 0;

        foreach ($predictions as $pred) {
            $actual = $this->determineActualOutcome($pred->result);
            if ($actual === $pred->predicted_outcome) {
                $correct++;
            }
        }

        $accuracy = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

        // Calculate accuracy by confidence level
        $confidenceGroups = [
            'high' => ['min' => 0.7, 'max' => 1.0],
            'medium' => ['min' => 0.55, 'max' => 0.7],
            'low' => ['min' => 0.0, 'max' => 0.55],
        ];

        $confidenceAccuracy = [];

        foreach ($confidenceGroups as $group => $range) {
            $groupPredictions = $predictions->filter(function($pred) use ($range) {
                return $pred->confidence >= $range['min'] && $pred->confidence < $range['max'];
            });

            if ($groupPredictions->count() > 0) {
                $groupCorrect = $groupPredictions->filter(function($pred) {
                    $actual = $this->determineActualOutcome($pred->result);
                    return $actual === $pred->predicted_outcome;
                })->count();

                $confidenceAccuracy[$group] = [
                    'predictions' => $groupPredictions->count(),
                    'correct' => $groupCorrect,
                    'accuracy' => round(($groupCorrect / $groupPredictions->count()) * 100, 2),
                    'average_confidence' => round($groupPredictions->avg('confidence'), 3),
                ];
            }
        }

        return [
            'total_predictions' => $total,
            'correct_predictions' => $correct,
            'accuracy' => $accuracy,
            'confidence_based_accuracy' => $confidenceAccuracy,
            'time_period' => [
                'start' => $predictions->min('match_date'),
                'end' => $predictions->max('match_date'),
            ],
        ];
    }

    /**
     * Determine actual outcome from result string
     */
    protected function determineActualOutcome(?string $result)
    {
        if (!$result) {
            return 'unknown';
        }

        $parts = explode('-', $result);
        if (count($parts) !== 2) {
            return 'unknown';
        }

        $homeScore = intval(trim($parts[0]));
        $awayScore = intval(trim($parts[1]));

        if ($homeScore > $awayScore) {
            return 'home';
        } elseif ($homeScore < $awayScore) {
            return 'away';
        } else {
            return 'draw';
        }
    }

    /**
     * Clean up old predictions
     */
    public function cleanupOldPredictions(int $days = 7)
    {
        $cutoffDate = Carbon::now()->subDays($days);

        $deleted = Prediction::where('created_at', '<', $cutoffDate)->delete();

        Log::info('Cleaned up old predictions', [
            'deleted_count' => $deleted,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deleted;
    }

    /**
     * Get predictions for a specific match
     */
    public function getMatchPredictions(int $matchId, array $options = [])
    {
        $match = MatchModel::with(['homeTeam', 'awayTeam'])->find($matchId);
        
        if (!$match) {
            throw new \Exception("Match not found: {$matchId}");
        }

        $query = Prediction::with(['model', 'market'])
            ->where('match_id', $matchId);

        if (!empty($options['model_id'])) {
            $query->where('model_id', $options['model_id']);
        }

        if (!empty($options['market_id'])) {
            $query->where('market_id', $options['market_id']);
        }

        $predictions = $query->orderBy('created_at', 'desc')->get();

        $formattedPredictions = [];
        foreach ($predictions as $prediction) {
            $formattedPredictions[] = $this->formatPredictionResponse($match, $prediction, [
                'predicted_outcome' => $prediction->predicted_outcome,
                'probability' => $prediction->probability,
                'confidence' => $prediction->confidence,
            ]);
        }

        return [
            'match_id' => $matchId,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
            'match_date' => $match->match_date,
            'predictions' => $formattedPredictions,
            'count' => count($formattedPredictions),
        ];
    }
}