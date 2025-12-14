<?php
// app/Jobs/ProcessPythonRequest.php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Services\PythonBridgeService;

class ProcessPythonRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;
    public $backoff = [5, 10, 15];

    protected $endpoint;
    protected $data;
    protected $method;
    protected $jobId;
    protected $retryCount;

    /**
     * Create a new job instance.
     */
    public function __construct(string $endpoint, array $data, string $method = 'post', string $jobId = null, int $retryCount = 0)
    {
        $this->endpoint = $endpoint;
        $this->data = $data;
        $this->method = $method;
        $this->jobId = $jobId ?? uniqid('python_', true);
        $this->retryCount = $retryCount;
        
        $this->onQueue(config('python.queues.default_queue', 'default'));
    }

    /**
     * Execute the job.
     */
    public function handle(PythonBridgeService $pythonBridge)
    {
        Log::info('Processing Python request job', [
            'job_id' => $this->jobId,
            'endpoint' => $this->endpoint,
            'retry_count' => $this->retryCount,
            'queue' => $this->queue,
        ]);

        try {
            // Generate cache key
            $cacheKey = 'python_request_' . md5($this->endpoint . json_encode($this->data));
            
            // Check if result already cached
            $cachedResult = Cache::get($cacheKey);
            if ($cachedResult) {
                Log::info('Returning cached result for Python request', [
                    'job_id' => $this->jobId,
                    'cache_key' => $cacheKey,
                ]);
                return $cachedResult;
            }

            // Call Python bridge service
            $response = $this->makePythonRequest();

            if ($response['status'] === 'success') {
                // Cache successful response
                $ttl = $this->getCacheTtl();
                Cache::put($cacheKey, $response, $ttl);
                
                Log::info('Python request successful', [
                    'job_id' => $this->jobId,
                    'endpoint' => $this->endpoint,
                    'cached_ttl' => $ttl,
                ]);
                
                return $response;
            } else {
                throw new \Exception('Python service returned error: ' . ($response['error'] ?? 'Unknown error'));
            }

        } catch (\Exception $e) {
            Log::error('Failed to process Python request', [
                'job_id' => $this->jobId,
                'endpoint' => $this->endpoint,
                'error' => $e->getMessage(),
                'retry_count' => $this->retryCount,
            ]);

            // Check if we should retry
            if ($this->retryCount < $this->tries - 1) {
                $this->retryWithDelay();
            } else {
                $this->handlePermanentFailure();
            }
        }
    }

    /**
     * Make request to Python service
     */
    protected function makePythonRequest()
    {
        $pythonBridge = app(PythonBridgeService::class);
        
        switch ($this->endpoint) {
            case config('python.endpoints.analyze_match'):
                if (isset($this->data['match_id'])) {
                    return $pythonBridge->analyzeMatch($this->data['match_id']);
                }
                break;
                
            case config('python.endpoints.analyze_batch'):
                if (isset($this->data['matches'])) {
                    $matchIds = array_column($this->data['matches'], 'match_id');
                    return $pythonBridge->analyzeBatch($matchIds);
                }
                break;
                
            case config('python.endpoints.analyze_team_form'):
                if (isset($this->data['team_code'])) {
                    return $pythonBridge->analyzeTeamForm(
                        $this->data['team_code'],
                        $this->data['venue'] ?? null
                    );
                }
                break;
                
            case config('python.endpoints.analyze_head_to_head'):
                if (isset($this->data['match_id'])) {
                    return $pythonBridge->analyzeHeadToHead($this->data['match_id']);
                }
                break;
                
            case config('python.endpoints.generate_slips'):
                if (isset($this->data['master_slip'])) {
                    return $pythonBridge->generateSlips(
                        $this->data['master_slip'],
                        $this->data['options'] ?? []
                    );
                }
                break;
                
            case config('python.endpoints.generate_predictions'):
                if (isset($this->data['matches'])) {
                    $matchIds = array_column($this->data['matches'], 'match_id');
                    return $pythonBridge->generatePredictions(
                        $matchIds,
                        $this->data['model'] ?? null
                    );
                }
                break;
                
            case config('python.endpoints.train_model'):
                if (isset($this->data['model_type'])) {
                    return $pythonBridge->trainModel(
                        $this->data['model_type'],
                        $this->data['training_data'] ?? null
                    );
                }
                break;
        }

        throw new \Exception('Invalid endpoint or missing data');
    }

    /**
     * Get cache TTL based on endpoint
     */
    protected function getCacheTtl()
    {
        $endpoint = $this->endpoint;
        
        if (strpos($endpoint, 'analyze-match') !== false) {
            return config('python.cache.match_analysis', 3600); // 1 hour
        } elseif (strpos($endpoint, 'team-form') !== false) {
            return config('python.cache.team_form', 1800); // 30 minutes
        } elseif (strpos($endpoint, 'head-to-head') !== false) {
            return config('python.cache.h2h_analysis', 7200); // 2 hours
        } elseif (strpos($endpoint, 'predict') !== false) {
            return config('python.cache.predictions', 1800); // 30 minutes
        }
        
        return 1800; // Default 30 minutes
    }

    /**
     * Retry job with delay
     */
    protected function retryWithDelay()
    {
        $nextRetryCount = $this->retryCount + 1;
        $delay = $this->backoff[$this->retryCount] ?? 5;
        
        Log::info('Retrying Python request', [
            'job_id' => $this->jobId,
            'retry_count' => $nextRetryCount,
            'delay_seconds' => $delay,
        ]);

        // Dispatch new job with incremented retry count
        self::dispatch($this->endpoint, $this->data, $this->method, $this->jobId, $nextRetryCount)
            ->delay(now()->addSeconds($delay))
            ->onQueue($this->queue);
    }

    /**
     * Handle permanent failure
     */
    protected function handlePermanentFailure()
    {
        Log::error('Python request permanently failed after all retries', [
            'job_id' => $this->jobId,
            'endpoint' => $this->endpoint,
            'max_retries' => $this->tries,
        ]);

        // Store failure information
        $failureData = [
            'job_id' => $this->jobId,
            'endpoint' => $this->endpoint,
            'data' => $this->data,
            'method' => $this->method,
            'failed_at' => Carbon::now()->toISOString(),
            'retry_count' => $this->retryCount,
        ];

        Cache::put("python_failure_{$this->jobId}", $failureData, 86400); // Store for 24 hours

        // Optionally notify admin or trigger alert
        $this->notifyFailure($failureData);
    }

    /**
     * Notify about failure
     */
    protected function notifyFailure(array $failureData)
    {
        // Implement notification logic (email, slack, etc.)
        // Example: Mail::to(config('app.admin_email'))->send(new PythonRequestFailed($failureData));
        
        Log::critical('Python service request failed permanently', $failureData);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::critical('ProcessPythonRequest job failed', [
            'job_id' => $this->jobId,
            'endpoint' => $this->endpoint,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}