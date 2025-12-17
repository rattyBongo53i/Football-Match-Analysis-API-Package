<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use App\Models\Job;
use App\Jobs\ProcessBetslipAnalysis;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JobController extends Controller
{
    private const MIN_MATCHES = 5;
    private const MAX_MATCHES = 10;
    private const ALLOWED_JOB_TYPES = ['ml_analysis'];
    private const AVERAGE_TIME_PER_MATCH = 10; // seconds
    private const JOB_ID_PREFIX = 'job_';

    /**
     * Trigger ML analysis for betslip
     * 
     * Endpoint: POST /api/jobs/analyze-betslip
     */
    public function analyzeBetslip(Request $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            $validationResult = $this->validateAnalysisRequest($request);
            if ($validationResult instanceof JsonResponse) {
                return $validationResult;
            }

            [$matchIds, $jobType] = $validationResult;

            $matchValidation = $this->validateMatchData($matchIds);
            if ($matchValidation instanceof JsonResponse) {
                return $matchValidation;
            }

            $matches = $this->fetchMatchesWithData($matchIds);
            if (!$this->validateAllMatchesLoaded($matchIds, $matches)) {
                return $this->errorResponse('Could not load all matches', 500);
            }

            $job = $this->createJobRecord($matchIds, $jobType, $matches);
            
            $this->dispatchAnalysisJob($job);

            DB::commit();

            $this->logJobQueued($job, $matchIds);

            return $this->jobQueuedResponse($job);

        } catch (ValidationException $e) {
            DB::rollBack();
            return $this->validationErrorResponse($e);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaction failed during betslip analysis', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'match_ids' => $request->match_ids ?? []
            ]);
            
            return $this->serverErrorResponse('Failed to trigger analysis', $e);
        }
    }

    /**
     * Validate analysis request parameters
     */
    private function validateAnalysisRequest(Request $request): JsonResponse|array
    {
        try {
            $validator = Validator::make($request->all(), [
                'match_ids' => [
                    'required',
                    'array',
                    'min:' . self::MIN_MATCHES,
                    'max:' . self::MAX_MATCHES
                ],
                'match_ids.*' => [
                    'required',
                    'integer',
                    'min:1'
                ],
                'job_type' => [
                    'required',
                    'string',
                    'in:' . implode(',', self::ALLOWED_JOB_TYPES)
                ]
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $matchIds = $request->match_ids;
            $jobType = $request->job_type;

            // Ensure unique match IDs
            $uniqueMatchIds = array_unique($matchIds);
            if (count($matchIds) !== count($uniqueMatchIds)) {
                return $this->errorResponse(
                    'Duplicate match IDs are not allowed',
                    422,
                    ['original_count' => count($matchIds), 'unique_count' => count($uniqueMatchIds)]
                );
            }

            return [$matchIds, $jobType];

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::warning('Unexpected error during request validation', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);
            
            return $this->errorResponse('Invalid request format', 400);
        }
    }

    /**
     * Validate that all matches exist
     */
    private function validateMatchData(array $matchIds): JsonResponse|null
    {
        try {
            $existingMatches = MatchModel::whereIn('id', $matchIds)
                ->pluck('id')
                ->toArray();
            
            $missingMatches = array_diff($matchIds, $existingMatches);
            
            if (!empty($missingMatches)) {
                return $this->errorResponse(
                    'Some matches not found',
                    404,
                    [
                        'missing_ids' => array_values($missingMatches),
                        'total_requested' => count($matchIds),
                        'found' => count($existingMatches)
                    ]
                );
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('Database error during match validation', [
                'error' => $e->getMessage(),
                'match_ids' => $matchIds
            ]);
            
            return $this->errorResponse('Failed to validate matches', 500);
        }
    }

    /**
     * Fetch matches with their relations
     */
    private function fetchMatchesWithData(array $matchIds)
    {
        try {
            return MatchModel::with(['markets', 'markets.outcomes'])
                ->whereIn('id', $matchIds)
                ->get()
                ->keyBy('id');
                
        } catch (\Exception $e) {
            Log::error('Failed to fetch match data', [
                'error' => $e->getMessage(),
                'match_ids' => $matchIds
            ]);
            
            throw new \RuntimeException('Could not load match data', 0, $e);
        }
    }

    /**
     * Verify all requested matches were loaded
     */
    private function validateAllMatchesLoaded(array $matchIds, $matches): bool
    {
        return $matches->count() === count($matchIds);
    }

    /**
     * Create job record in database
     */
    private function createJobRecord(array $matchIds, string $jobType, $matches): Job
    {
        try {
            $jobData = [
                'job_id' => $this->generateJobId(),
                'match_ids' => $matchIds,
                'job_type' => $jobType,
                'status' => 'pending',
                'progress' => 0,
                'match_data_snapshot' => $matches->map(function ($match) {
                    return $this->prepareMatchSnapshot($match);
                })->toArray(),
                'created_at' => now(),
                'updated_at' => now()
            ];

            $job = Job::create($jobData);

            if (!$job) {
                throw new \RuntimeException('Failed to create job record');
            }

            return $job;

        } catch (\Exception $e) {
            Log::error('Failed to create job record', [
                'error' => $e->getMessage(),
                'match_count' => count($matchIds),
                'job_type' => $jobType
            ]);
            
            throw new \RuntimeException('Could not create analysis job', 0, $e);
        }
    }

    /**
     * Generate unique job ID
     */
    private function generateJobId(): string
    {
        return self::JOB_ID_PREFIX . Str::random(10) . '_' . time();
    }

    /**
     * Dispatch analysis job to queue
     */
    private function dispatchAnalysisJob(Job $job): void
    {
        try {
            ProcessBetslipAnalysis::dispatch($job)
                ->onQueue('analysis')
                ->delay(now()->addSeconds(1)); // Small delay to ensure job record is saved
            
            Log::info('Analysis job dispatched', ['job_id' => $job->job_id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to dispatch analysis job', [
                'job_id' => $job->job_id,
                'error' => $e->getMessage()
            ]);
            
            throw new \RuntimeException('Could not queue analysis job', 0, $e);
        }
    }

    /**
     * Get job status
     */
    public function getStatus(string $jobId): JsonResponse
    {
        try {
            $job = $this->findJobById($jobId);
            
            if (!$job) {
                return $this->errorResponse('Job not found', 404, ['job_id' => $jobId]);
            }
            
            return response()->json([
                'job_id' => $job->job_id,
                'status' => $job->status,
                'progress' => (int) $job->progress,
                'estimated_completion' => $this->calculateEstimatedCompletion($job),
                'started_at' => $job->started_at?->toISOString(),
                'completed_at' => $job->completed_at?->toISOString(),
                'created_at' => $job->created_at->toISOString(),
                'updated_at' => $job->updated_at->toISOString(),
                'match_count' => count($job->match_ids)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching job status', [
                'job_id' => $jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->serverErrorResponse('Failed to fetch job status', $e);
        }
    }

    /**
     * Get job results
     */
    public function getResults(string $jobId): JsonResponse
    {
        try {
            $job = $this->findJobById($jobId);
            
            if (!$job) {
                return $this->errorResponse('Job not found', 404, ['job_id' => $jobId]);
            }
            
            if ($job->status !== 'completed') {
                return $this->errorResponse(
                    'Job is not completed yet',
                    400,
                    [
                        'status' => $job->status,
                        'progress' => $job->progress,
                        'estimated_completion' => $this->calculateEstimatedCompletion($job)
                    ]
                );
            }
            
            if (empty($job->results)) {
                return $this->errorResponse('No results available for this job', 404, [
                    'job_id' => $job->job_id,
                    'status' => $job->status
                ]);
            }
            
            return response()->json([
                'job_id' => $job->job_id,
                'status' => $job->status,
                'completed_at' => $job->completed_at?->toISOString(),
                'results' => $job->results,
                'metadata' => [
                    'match_count' => count($job->match_ids),
                    'processing_time' => $this->calculateProcessingTime($job)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching job results', [
                'job_id' => $jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->serverErrorResponse('Failed to fetch job results', $e);
        }
    }

    /**
     * Find job by ID with safety checks
     */
    private function findJobById(string $jobId): ?Job
    {
        if (empty($jobId) || strlen($jobId) > 100) {
            return null;
        }
        
        try {
            return Job::where('job_id', $jobId)->first();
        } catch (\Exception $e) {
            Log::warning('Database error finding job', [
                'job_id' => $jobId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Prepare match snapshot for job processing
     */
    private function prepareMatchSnapshot(MatchModel $match): array
    {
        try {
            $snapshot = [
                'id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'league' => $match->league,
                'match_date' => $match->match_date instanceof \DateTimeInterface 
                    ? $match->match_date->toDateString() 
                    : $match->match_date,
                'status' => $match->status,
                'home_score' => (int) $match->home_score,
                'away_score' => (int) $match->away_score,
                'home_form' => $match->home_form ?? [],
                'away_form' => $match->away_form ?? [],
                'head_to_head' => $match->head_to_head ?? [],
                'snapshot_time' => now()->toISOString()
            ];

            $snapshot['markets'] = $match->markets->map(function ($market) {
                return [
                    'id' => $market->id,
                    'name' => $market->name,
                    'market_type' => $market->market_type,
                    'odds' => (float) $market->odds,
                    'outcomes' => $market->outcomes->map(function ($outcome) {
                        return [
                            'outcome' => $outcome->outcome,
                            'odds' => (float) $outcome->odds
                        ];
                    })->toArray()
                ];
            })->toArray();

            return $snapshot;

        } catch (\Exception $e) {
            Log::warning('Error preparing match snapshot', [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
            
            // Return minimal snapshot
            return [
                'id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'league' => $match->league,
                'error' => 'Partial snapshot due to processing error'
            ];
        }
    }

    /**
     * Calculate estimated completion time
     */
    private function calculateEstimatedCompletion(Job $job): ?string
    {
        if (!$job->started_at || $job->status !== 'running') {
            return null;
        }

        try {
            $matchCount = count($job->match_ids);
            $estimatedSeconds = $matchCount * self::AVERAGE_TIME_PER_MATCH;
            $estimatedCompletion = $job->started_at->copy()->addSeconds($estimatedSeconds);
            
            return $estimatedCompletion->toISOString();
            
        } catch (\Exception $e) {
            Log::debug('Error calculating estimated completion', [
                'job_id' => $job->job_id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate actual processing time
     */
    private function calculateProcessingTime(Job $job): ?string
    {
        if (!$job->started_at || !$job->completed_at) {
            return null;
        }

        try {
            $seconds = $job->completed_at->diffInSeconds($job->started_at);
            return gmdate('H:i:s', $seconds);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Response helper methods
     */
    
    private function jobQueuedResponse(Job $job): JsonResponse
    {
        return response()->json([
            'job_id' => $job->job_id,
            'status' => 'pending',
            'message' => 'Analysis job queued successfully',
            'estimated_wait_time' => '30-60 seconds',
            'check_status_url' => url("/api/jobs/{$job->job_id}/status"),
            'queue_position' => 'unknown' // Could integrate with Redis to get actual position
        ], 202);
    }

    private function errorResponse(string $message, int $statusCode, array $data = []): JsonResponse
    {
        $response = ['error' => $message];
        
        if (!empty($data)) {
            $response['details'] = $data;
        }
        
        return response()->json($response, $statusCode);
    }

    private function validationErrorResponse(ValidationException $e): JsonResponse
    {
        return response()->json([
            'error' => 'Validation failed',
            'message' => 'Please check your input',
            'errors' => $e->errors(),
            'required_range' => [
                'min_matches' => self::MIN_MATCHES,
                'max_matches' => self::MAX_MATCHES
            ]
        ], 422);
    }

    private function serverErrorResponse(string $message, \Throwable $e): JsonResponse
    {
        Log::error($message, [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        $response = ['error' => $message];
        
        if (config('app.debug')) {
            $response['debug'] = [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ];
        }
        
        return response()->json($response, 500);
    }

    /**
     * Logging helper
     */
    private function logJobQueued(Job $job, array $matchIds): void
    {
        Log::info('Betslip analysis job queued successfully', [
            'job_id' => $job->job_id,
            'match_count' => count($matchIds),
            'job_type' => $job->job_type,
            'created_at' => $job->created_at->toISOString(),
            'matches' => $matchIds
        ]);
    }
}