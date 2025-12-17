<?php

namespace App\Jobs;

use App\Models\Job as AnalysisJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ProcessBetslipAnalysis implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes

    /**
     * The analysis job instance.
     *
     * @var AnalysisJob
     */
    protected $analysisJob;

    /**
     * Create a new job instance.
     *
     * @param AnalysisJob $analysisJob
     * @return void
     */
    public function __construct(AnalysisJob $analysisJob)
    {
        $this->analysisJob = $analysisJob;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            // Update job status to running
            $this->analysisJob->update([
                'status' => 'running',
                'started_at' => now(),
                'progress' => 10
            ]);

            Log::info('Starting betslip analysis', [
                'job_id' => $this->analysisJob->job_id,
                'match_count' => count($this->analysisJob->match_ids)
            ]);

            // Prepare data for Python engine
            $analysisData = [
                'job_id' => $this->analysisJob->job_id,
                'match_count' => count($this->analysisJob->match_ids),
                'matches' => $this->analysisJob->match_data_snapshot,
                'requested_at' => $this->analysisJob->created_at->toISOString()
            ];

            // Convert to JSON for Python input
            $inputData = json_encode($analysisData, JSON_PRETTY_PRINT);
            
            // Save input data to temp file
            $tempFile = tempnam(sys_get_temp_dir(), 'analysis_');
            file_put_contents($tempFile, $inputData);
            
            // Update progress
            $this->analysisJob->update(['progress' => 30]);

            // Call Python ML engine
            // IMPORTANT: Replace with your actual Python script path
            $pythonScriptPath = base_path('python_engine/analyze_betslip.py');
            
            // Check if Python script exists
            if (!file_exists($pythonScriptPath)) {
                throw new \Exception("Python analysis script not found at: {$pythonScriptPath}");
            }

            Log::info('Executing Python analysis', [
                'job_id' => $this->analysisJob->job_id,
                'script_path' => $pythonScriptPath,
                'temp_file' => $tempFile
            ]);

            // Execute Python script
            $process = Process::run("python3 {$pythonScriptPath} {$tempFile}");
            
            // Update progress
            $this->analysisJob->update(['progress' => 70]);

            if (!$process->successful()) {
                $errorOutput = $process->errorOutput();
                Log::error('Python analysis failed', [
                    'job_id' => $this->analysisJob->job_id,
                    'error' => $errorOutput,
                    'exit_code' => $process->exitCode()
                ]);
                
                throw new \Exception("Python analysis failed: " . $errorOutput);
            }

            $output = $process->output();
            Log::info('Python analysis completed', [
                'job_id' => $this->analysisJob->job_id,
                'output_length' => strlen($output)
            ]);

            // Parse results
            $results = json_decode($output, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception("Failed to parse JSON results: " . json_last_error_msg());
            }

            // Update progress and store results
            $this->analysisJob->update([
                'progress' => 100,
                'status' => 'completed',
                'completed_at' => now(),
                'results' => $results
            ]);

            Log::info('Betslip analysis completed successfully', [
                'job_id' => $this->analysisJob->job_id,
                'accumulators_generated' => $results['summary']['total_accumulators_generated'] ?? 0
            ]);

            // Clean up temp file
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

        } catch (\Exception $e) {
            Log::error('Betslip analysis job failed', [
                'job_id' => $this->analysisJob->job_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->analysisJob->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now()
            ]);

            throw $e; // Let Laravel handle retries
        }
    }

    /**
     * Handle a job failure.
     *
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        Log::critical('Betslip analysis job failed permanently', [
            'job_id' => $this->analysisJob->job_id,
            'error' => $exception->getMessage(),
            'exception' => get_class($exception)
        ]);
    }
}