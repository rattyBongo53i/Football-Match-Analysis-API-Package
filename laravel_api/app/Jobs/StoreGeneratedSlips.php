<?php

namespace App\Jobs;

use App\Models\MasterSlip;
use App\Models\GeneratedSlip; // We'll define this model next
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class StoreGeneratedSlips implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The master slip database ID (not the string ID from Python)
     */
    protected int $masterSlipId;

    /**
     * The full Python response containing generated_slips
     */
    protected array $pythonResponse;

    /**
     * Create a new job instance.
     */
    public function __construct(int $masterSlipId, array $pythonResponse)
    {
        $this->masterSlipId = $masterSlipId;
        $this->pythonResponse = $pythonResponse;

        // Use the same queue as Python communication for consistency
        $this->onQueue('python_engine');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting to store generated slips', [
            'master_slip_id' => $this->masterSlipId,
            'generated_slips_count' => count($this->pythonResponse['generated_slips'] ?? []),
        ]);

        $masterSlip = MasterSlip::findOrFail($this->masterSlipId);

        // Optional: Clear old generated slips if you want to replace them
        // $masterSlip->generatedSlips()->delete();

        foreach ($this->pythonResponse['generated_slips'] ?? [] as $slipData) {
            // Create the main generated slip record
            $generatedSlip = $masterSlip->generatedSlips()->create([
                'slip_id' => $slipData['slip_id'],
                'stake' => $slipData['stake'],
                'total_odds' => $slipData['total_odds'],
                'possible_return' => $slipData['possible_return'],
                'risk_level' => $slipData['risk_level'],
                'confidence_score' => $slipData['confidence_score'],
                'raw_data' => $slipData, // fallback full data
            ]);

            // Store each leg
            foreach ($slipData['legs'] as $leg) {
                $generatedSlip->legs()->create([
                    'match_id' => $leg['match_id'],
                    'market' => $leg['market'],
                    'selection' => $leg['selection'],
                    'odds' => $leg['odds'],
                ]);
            }
        }

        // Update master slip status
        $masterSlip->update([
            'status' => 'processed',
            'processed_at' => now(),
        ]);

        Log::info('Generated slips stored successfully', [
            'master_slip_id' => $this->masterSlipId,
        ]);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('StoreGeneratedSlipsJob failed', [
            'master_slip_id' => $this->masterSlipId,
            'error' => $exception->getMessage(),
        ]);

        // Optionally mark master slip as failed
        MasterSlip::where('id', $this->masterSlipId)->update([
            'status' => 'failed',
            'error_message' => 'Failed to store generated slips: ' . $exception->getMessage(),
            'failed_at' => now(),
        ]);
    }
}