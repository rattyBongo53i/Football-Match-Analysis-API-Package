<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\MatchModel;
use App\Models\Team_Form;
use App\Models\Prediction;
use App\Models\MLModel;
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

            $matches = MatchModel::with([
                'homeTeam',
                'awayTeam',
                'teamForms' => fn ($q) => $q->orderBy('created_at', 'desc')->limit(5),
                'headToHead',
                'odds',
            ])->whereIn('id', $matchIds)->get();

            if ($matches->isEmpty()) {
                throw new \Exception('No matches found');
            }

            $predictions = [];
            $usePythonML = $options['use_ml'] ?? true;
            $modelName   = $options['model'] ?? 'form_analysis';
            $marketName  = $options['market'] ?? '1X2';

            foreach ($matches as $match) {
                $predictionData = $usePythonML
                    ? $this->generatePythonPrediction($match, $modelName)
                    : $this->generateStatisticalPrediction($match);

                $prediction = $this->storePrediction(
                    $match,
                    $predictionData,
                    $modelName,
                    $marketName
                );

                $predictions[] = $this->formatPredictionResponse(
                    $match,
                    $prediction,
                    $predictionData
                );
            }

            $confidenceMetrics = $this->calculateConfidenceMetrics($predictions);

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
            ]);

            return $this->generateFallbackPredictions($matchIds);
        }
    }

    protected function generatePythonPrediction(MatchModel $match, string $modelName)
    {
        try {
            $response = $this->pythonBridge->generatePredictions(
                [$match->id],
                ['model' => $modelName]
            );

            if (!empty($response['predictions'][0])) {
                $pred = $response['predictions'][0];

                $probabilities = $pred['probabilities'] ?? [];
                $outcome = $this->determineOutcomeFromProbabilities($probabilities);

                return [
                    'predicted_outcome' => $outcome,
                    'probability' => $probabilities[$outcome] ?? ($pred['confidence'] ?? 0.5),
                    'confidence' => $pred['confidence'] ?? 0.5,
                    'features_used' => $this->extractFeaturesUsed($pred),
                    'raw_data' => $pred,
                    'source' => 'python_ml',
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Python ML failed, fallback to statistical', [
                'match_id' => $match->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->generateStatisticalPrediction($match);
    }

    protected function generateStatisticalPrediction(MatchModel $match)
    {
        $homeForm = $this->getTeamFormData($match->homeTeam, 'home', $match);
        $awayForm = $this->getTeamFormData($match->awayTeam, 'away', $match);
        $h2h      = $this->getHeadToHeadData($match);

      
        $probabilities = $this->calculateProbabilities($homeForm, $awayForm, $h2h, $match->markets->toArray() ?? []);

        $outcome = $this->determineOutcomeFromProbabilities($probabilities);

        return [
            'predicted_outcome' => $outcome,
            'probability' => $probabilities[$outcome] ?? 0.33,
            'confidence' => $this->calculateConfidence(
                $probabilities,
                $homeForm,
                $awayForm,
                $h2h
            ),
            'features_used' => [
                'home_form_rating' => $homeForm['form_rating'],
                'away_form_rating' => $awayForm['form_rating'],
                'h2h_meetings' => $h2h['total_meetings'],
            ],
            'raw_data' => compact('probabilities', 'homeForm', 'awayForm', 'h2h'),
            'source' => 'statistical',
        ];
    }

    protected function getTeamFormData($team, string $venue, MatchModel $match): array
    {
        if (!$team) {
            return $this->defaultFormData();
        }

        $forms = Team_Form::where('team_id', $team->code)
            ->where('venue', $venue)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        if ($forms->isEmpty()) {
            return array_merge($this->defaultFormData(), [
                'form_rating' => $team->form_rating ?? 5.0,
                'form_momentum' => $team->momentum ?? 0.0,
            ]);
        }

        $count = $forms->count();
        $sum = $forms->reduce(fn ($c, $f) => [
            'rating' => $c['rating'] + ($f->form_rating ?? 5),
            'momentum' => $c['momentum'] + ($f->form_momentum ?? 0),
            'scored' => $c['scored'] + ($f->avg_goals_scored ?? 1.2),
            'conceded' => $c['conceded'] + ($f->avg_goals_conceded ?? 1.2),
            'played' => $c['played'] + ($f->matches_played ?? 0),
            'wins' => $c['wins'] + ($f->wins ?? 0),
            'draws' => $c['draws'] + ($f->draws ?? 0),
            'losses' => $c['losses'] + ($f->losses ?? 0),
        ], ['rating'=>0,'momentum'=>0,'scored'=>0,'conceded'=>0,'played'=>0,'wins'=>0,'draws'=>0,'losses'=>0]);

        return [
            'form_rating' => round($sum['rating'] / $count, 2),
            'form_momentum' => round($sum['momentum'] / $count, 3),
            'avg_goals_scored' => round($sum['scored'] / $count, 2),
            'avg_goals_conceded' => round($sum['conceded'] / $count, 2),
            'matches_played' => $sum['played'],
            'win_rate' => $sum['played'] ? round($sum['wins'] / $sum['played'], 3) : 0.333,
            'draw_rate' => $sum['played'] ? round($sum['draws'] / $sum['played'], 3) : 0.333,
            'loss_rate' => $sum['played'] ? round($sum['losses'] / $sum['played'], 3) : 0.334,
        ];
    }

    protected function defaultFormData(): array
    {
        return [
            'form_rating' => 5.0,
            'form_momentum' => 0.0,
            'avg_goals_scored' => 1.2,
            'avg_goals_conceded' => 1.2,
            'matches_played' => 0,
            'win_rate' => 0.333,
            'draw_rate' => 0.333,
            'loss_rate' => 0.334,
        ];
    }

    protected function getHeadToHeadData(MatchModel $match): array
    {
        $h2h = $match->headToHead;

        if (!$h2h || $h2h->total_meetings === 0) {
            return [
                'total_meetings' => 0,
                'home_win_rate' => 0,
                'away_win_rate' => 0,
                'draw_rate' => 0,
            ];
        }

        return [
            'total_meetings' => $h2h->total_meetings,
            'home_win_rate' => round($h2h->home_wins / $h2h->total_meetings, 3),
            'away_win_rate' => round($h2h->away_wins / $h2h->total_meetings, 3),
            'draw_rate' => round($h2h->draws / $h2h->total_meetings, 3),
        ];
    }

    protected function calculateProbabilities(array $home, array $away, array $h2h, array $odds)
    {
        $homeProb = 0.4 + (($home['form_rating'] - $away['form_rating']) * 0.05);
        $drawProb = 0.3;
        $awayProb = 1 - $homeProb - $drawProb;

        $homeProb = max(0.05, min(0.9, $homeProb));
        $awayProb = max(0.05, min(0.9, $awayProb));

        $total = $homeProb + $drawProb + $awayProb;

        return [
            'home' => round($homeProb / $total, 3),
            'draw' => round($drawProb / $total, 3),
            'away' => round($awayProb / $total, 3),
        ];
    }

    protected function determineOutcomeFromProbabilities(array $probs)
    {
        if (!$probs) return 'draw';
        return array_keys($probs, max($probs))[0];
    }

    protected function calculateConfidence(array $probs, array $home, array $away, array $h2h)
    {
        return round(min(0.95, max(0.3, (max($probs) - min($probs)) * 2)), 3);
    }

    protected function extractFeaturesUsed(array $pred): array
    {
        return $pred['features_used'] ?? $pred['features'] ?? [];
    }

    protected function storePrediction(MatchModel $match, array $data, string $modelName, string $marketName)
    {
        $model = MLModel::firstOrCreate(
            ['name' => $modelName],
            ['model_type' => $data['source'], 'version' => '1.0']
        );

        $market = Market::firstOrCreate(
            ['name' => $marketName],
            ['category' => 'match_result', 'code' => '1X2']
        );

        return Prediction::updateOrCreate(
            [
                'match_id' => $match->id,
                'model_id' => $model->id,
                'market_id' => $market->id,
            ],
            [
                'predicted_outcome' => $data['predicted_outcome'],
                'probability' => $data['probability'],
                'confidence' => $data['confidence'],
                'features_used' => $data['features_used'],
            ]
        );
    }

    protected function formatPredictionResponse(MatchModel $match, Prediction $prediction, array $data)
    {
        return [
            'match_id' => $match->id,
            'home_team' => $match->home_team,
            'away_team' => $match->away_team,
            'predicted_outcome' => $prediction->predicted_outcome,
            'probability' => (float) $prediction->probability,
            'confidence' => (float) $prediction->confidence,
            'model' => $prediction->model->name ?? 'unknown',
            'market' => $prediction->market->name ?? 'unknown',
            'features_used' => $prediction->features_used,
            'generated_at' => $prediction->created_at->toISOString(),
        ];
    }

    protected function calculateConfidenceMetrics(array $predictions)
    {
        if (!$predictions) return [];

        $conf = array_column($predictions, 'confidence');

        return [
            'average_confidence' => round(array_sum($conf) / count($conf), 3),
            'min_confidence' => min($conf),
            'max_confidence' => max($conf),
        ];
    }

    protected function generateFallbackPredictions(array $matchIds)
    {
        return [
            'success' => true,
            'predictions' => [],
            'warning' => 'Fallback used due to system error',
            'generated_at' => Carbon::now()->toISOString(),
        ];
    }
}
