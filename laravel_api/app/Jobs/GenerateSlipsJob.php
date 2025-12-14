<?php
// app/Jobs/GenerateSlipsJob.php

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
use App\Models\Slip;
use App\Models\Prediction;
use App\Models\Market;
use App\Services\GeneratorService;

class GenerateSlipsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes for slip generation
    public $tries = 2;
    public $backoff = [30, 60];

    protected $matchIds;
    protected $options;
    protected $jobId;
    protected $userId;
    protected $projectId;

    /**
     * Create a new job instance.
     */
    public function __construct(array $matchIds, array $options = [], string $jobId = null, int $userId = null, int $projectId = null)
    {
        $this->matchIds = $matchIds;
        $this->options = $options;
        $this->jobId = $jobId ?? uniqid('slip_', true);
        $this->userId = $userId;
        $this->projectId = $projectId;
        
        $this->onQueue(config('python.queues.slip_generation', 'slip_generation'));
    }

    /**
     * Execute the job.
     */
    public function handle(GeneratorService $generatorService)
    {
        Log::info('Starting slip generation job', [
            'job_id' => $this->jobId,
            'match_count' => count($this->matchIds),
            'user_id' => $this->userId,
            'project_id' => $this->projectId,
            'queue' => $this->queue,
        ]);

        try {
            // Validate matches exist
            $matches = MatchModel::whereIn('id', $this->matchIds)->get();
            
            if ($matches->count() !== count($this->matchIds)) {
                throw new \Exception('One or more matches not found');
            }

            // Check if matches have predictions
            $predictions = Prediction::whereIn('match_id', $this->matchIds)
                ->whereNotNull('predicted_outcome')
                ->get();
            
            if ($predictions->isEmpty()) {
                Log::warning('No predictions found for matches, generating them first', [
                    'match_ids' => $this->matchIds,
                ]);
                
                // Generate predictions first
                $this->generatePredictionsForMatches();
                
                // Fetch predictions again
                $predictions = Prediction::whereIn('match_id', $this->matchIds)
                    ->whereNotNull('predicted_outcome')
                    ->get();
            }

            // Create master slip structure
            $masterSlip = $this->createMasterSlip($matches, $predictions);

            // Generate slips using generator service
            $result = $generatorService->generateSlips($masterSlip, $this->options);

            if ($result['success']) {
                // Store generated slips in database
                $storedSlips = $this->storeGeneratedSlips($result['slips'], $masterSlip, $result['statistics']);
                
                Log::info('Slip generation completed successfully', [
                    'job_id' => $this->jobId,
                    'generated_slips' => count($result['slips']),
                    'stored_slips' => count($storedSlips),
                    'statistics' => $result['statistics'],
                ]);

                return [
                    'job_id' => $this->jobId,
                    'success' => true,
                    'slips_generated' => count($result['slips']),
                    'slips_stored' => count($storedSlips),
                    'master_slip_id' => $masterSlip['id'],
                    'statistics' => $result['statistics'],
                ];
            } else {
                throw new \Exception('Generator service failed: ' . ($result['error'] ?? 'Unknown error'));
            }

        } catch (\Exception $e) {
            Log::error('Failed to generate slips', [
                'job_id' => $this->jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Create fallback slip
            $this->createFallbackSlip();
            
            throw $e;
        }
    }

    /**
     * Create master slip structure
     */
    protected function createMasterSlip($matches, $predictions)
    {
        $matchData = [];
        $totalOdds = 1.0;
        $totalConfidence = 1.0;

        foreach ($matches as $match) {
            // Find the best prediction for this match
            $matchPredictions = $predictions->where('match_id', $match->id);
            
            // Get highest confidence prediction
            $bestPrediction = $matchPredictions->sortByDesc('confidence')->first();
            
            if (!$bestPrediction) {
                // Use default prediction
                $bestPrediction = (object)[
                    'predicted_outcome' => 'draw',
                    'probability' => 0.33,
                    'confidence' => 0.5,
                    'market_id' => Market::where('name', '1X2')->first()->id ?? null,
                ];
            }

            // Get market
            $market = Market::find($bestPrediction->market_id);
            
            // Get odds for the predicted outcome
            $odds = $this->getOddsForOutcome($match, $bestPrediction->predicted_outcome, $market);

            $matchEntry = [
                'id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'match_date' => $match->match_date,
                'league' => $match->league,
                'prediction' => $bestPrediction->predicted_outcome,
                'probability' => (float)$bestPrediction->probability,
                'confidence' => (float)$bestPrediction->confidence,
                'market_id' => $bestPrediction->market_id,
                'market_name' => $market ? $market->name : '1X2',
                'odds' => $odds,
                'analysis' => [
                    'form_rating_home' => $match->homeTeam->form_rating ?? 5.0,
                    'form_rating_away' => $match->awayTeam->form_rating ?? 5.0,
                ],
            ];

            $matchData[] = $matchEntry;
            $totalOdds *= $odds;
            $totalConfidence *= (float)$bestPrediction->confidence;
        }

        // Create master slip record
        $masterSlipRecord = Slip::create([
            'name' => $this->options['name'] ?? 'Master Slip ' . Carbon::now()->format('Y-m-d H:i'),
            'description' => $this->options['description'] ?? 'Automatically generated master slip',
            'user_id' => $this->userId,
            'project_id' => $this->projectId,
            'master_slip_id' => null, // This is the master slip
            'status' => 'generating',
            'total_odds' => $totalOdds,
            'stake' => 0,
            'potential_payout' => 0,
            'confidence_score' => round(pow($totalConfidence, 1 / count($matches)), 6), // Geometric mean
            'risk_level' => $this->calculateRiskLevel($totalConfidence, count($matches)),
            'selections' => $matchData,
        ]);

        return [
            'id' => $masterSlipRecord->id,
            'name' => $masterSlipRecord->name,
            'matches' => $matchData,
            'total_odds' => $totalOdds,
            'total_confidence' => $totalConfidence,
            'risk_level' => $masterSlipRecord->risk_level,
        ];
    }

    /**
     * Get odds for predicted outcome
     */
    protected function getOddsForOutcome($match, $outcome, $market)
    {
        // First try to get from match odds
        if (!empty($match->odds)) {
            $oddsData = $match->odds;
            
            if (is_array($oddsData)) {
                if ($market && $market->name === '1X2') {
                    switch ($outcome) {
                        case 'home':
                            return $oddsData['home'] ?? 2.0;
                        case 'draw':
                            return $oddsData['draw'] ?? 3.0;
                        case 'away':
                            return $oddsData['away'] ?? 2.5;
                    }
                }
            }
        }

        // Default odds based on outcome
        switch ($outcome) {
            case 'home':
                return 2.0;
            case 'draw':
                return 3.0;
            case 'away':
                return 2.5;
            default:
                return 2.0;
        }
    }

    /**
     * Calculate risk level
     */
    protected function calculateRiskLevel(float $totalConfidence, int $matchCount)
    {
        $avgConfidence = pow($totalConfidence, 1 / $matchCount);
        
        if ($avgConfidence >= 0.7) {
            return 'low';
        } elseif ($avgConfidence >= 0.55) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Generate predictions for matches if missing
     */
    protected function generatePredictionsForMatches()
    {
        // Dispatch prediction generation jobs
        foreach ($this->matchIds as $matchId) {
            ProcessMatchForML::dispatch($matchId, 'prediction', [
                'use_ml' => $this->options['use_ml_predictions'] ?? true,
                'model' => $this->options['prediction_model'] ?? 'form_analysis',
            ])->onQueue('ml_processing');
        }

        // Wait a bit for predictions to generate
        sleep(2);
    }

    /**
     * Store generated slips in database
     */
    protected function storeGeneratedSlips(array $generatedSlips, array $masterSlip, array $statistics)
    {
        $storedSlips = [];
        $stakePerSlip = $this->options['stake_per_slip'] ?? 1.0;
        $maxSlips = $this->options['max_slips_to_store'] ?? 50;

        foreach (array_slice($generatedSlips, 0, $maxSlips) as $index => $slipData) {
            try {
                $slip = Slip::create([
                    'name' => $this->options['slip_name_prefix'] ?? 'Generated Slip ' . ($index + 1),
                    'description' => $this->options['slip_description'] ?? 'Automatically generated slip',
                    'user_id' => $this->userId,
                    'project_id' => $this->projectId,
                    'master_slip_id' => $masterSlip['id'],
                    'status' => 'generated',
                    'total_odds' => $slipData['total_odds'],
                    'stake' => $stakePerSlip,
                    'potential_payout' => round($stakePerSlip * $slipData['total_odds'], 2),
                    'confidence_score' => $slipData['total_confidence'] ?? 0.5,
                    'risk_level' => $this->calculateIndividualRiskLevel($slipData),
                    'selections' => $slipData['matches'] ?? [],
                ]);

                $storedSlips[] = [
                    'id' => $slip->id,
                    'name' => $slip->name,
                    'total_odds' => $slip->total_odds,
                    'potential_payout' => $slip->potential_payout,
                    'confidence_score' => $slip->confidence_score,
                    'risk_level' => $slip->risk_level,
                ];

                // Update master slip status
                if ($index === 0) {
                    Slip::where('id', $masterSlip['id'])->update([
                        'status' => 'completed',
                        'confidence_score' => $statistics['avg_confidence'] ?? 0.5,
                    ]);
                }

            } catch (\Exception $e) {
                Log::warning('Failed to store slip', [
                    'index' => $index,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $storedSlips;
    }

    /**
     * Calculate risk level for individual slip
     */
    protected function calculateIndividualRiskLevel(array $slipData)
    {
        $totalConfidence = $slipData['total_confidence'] ?? 1.0;
        $matchCount = count($slipData['matches'] ?? []);
        
        if ($matchCount === 0) {
            return 'high';
        }
        
        $avgConfidence = pow($totalConfidence, 1 / $matchCount);
        
        if ($avgConfidence >= 0.7) {
            return 'low';
        } elseif ($avgConfidence >= 0.55) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Create fallback slip when generation fails
     */
    protected function createFallbackSlip()
    {
        try {
            $matches = MatchModel::whereIn('id', $this->matchIds)->get();
            
            $selections = [];
            $totalOdds = 1.0;
            
            foreach ($matches as $match) {
                $selection = [
                    'match_id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'prediction' => 'home', // Default to home win
                    'odds' => 2.0,
                    'confidence' => 0.5,
                    'market' => '1X2',
                ];
                
                $selections[] = $selection;
                $totalOdds *= 2.0;
            }
            
            $slip = Slip::create([
                'name' => 'Fallback Slip',
                'description' => 'Generated as fallback due to system error',
                'user_id' => $this->userId,
                'project_id' => $this->projectId,
                'status' => 'fallback',
                'total_odds' => $totalOdds,
                'stake' => 0,
                'potential_payout' => 0,
                'confidence_score' => 0.5,
                'risk_level' => 'high',
                'selections' => $selections,
            ]);
            
            Log::info('Fallback slip created', [
                'slip_id' => $slip->id,
                'match_count' => count($matches),
                'total_odds' => $totalOdds,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to create fallback slip', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::critical('GenerateSlipsJob failed', [
            'job_id' => $this->jobId,
            'match_ids' => $this->matchIds,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Update master slip status if it exists
        if (isset($this->masterSlipId)) {
            Slip::where('id', $this->masterSlipId)->update([
                'status' => 'failed',
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}