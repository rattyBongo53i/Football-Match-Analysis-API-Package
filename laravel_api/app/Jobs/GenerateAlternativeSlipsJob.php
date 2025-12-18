<?php
// app/Jobs/GenerateAlternativeSlipsJob.php

namespace App\Jobs;

use App\Models\MasterSlip;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// use League\Uri\Http;

class GenerateAlternativeSlipsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300;
    public $tries = 3;

    protected $masterSlipId;

    public function __construct($masterSlipId)
    {
        $this->masterSlipId = $masterSlipId;
    }

    public function handle()
    {
        $masterSlip = MasterSlip::with('selections.match')->findOrFail($this->masterSlipId);

        $payload = [
            'master_slip_id' => $masterSlip->id,
            'stake' => $masterSlip->stake,
            'matches' => $masterSlip->selections->map(function ($selection) {
                return [
                    'match_id' => $selection->match_id,
                    'match' => [
                        'home_team' => $selection->match->home_team,
                        'away_team' => $selection->match->away_team,
                        'league' => $selection->match->league,
                    ],
                    'markets' => $selection->markets,
                ];
            })->toArray(),
        ];

        try {
            $response = Http::timeout(180)->post('http://localhost:5000/generate-slips', $payload);

            if ($response->successful()) {
                // Save results
                $masterSlip->update([
                    'status' => 'completed',
                    'processed_at' => now(),
                ]);
                // Save alternative slips to DB (your model)
            } else {
                throw new \Exception($response->body());
            }
        } catch (\Exception $e) {
            $masterSlip->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            Log::error('Python slip generation failed', ['error' => $e->getMessage()]);
        }
    }
}