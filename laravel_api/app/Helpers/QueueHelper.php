<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Queue;

class QueueHelper
{
    /**
     * Get queue priorities for worker command
     */
    public static function getWorkerQueues(): string
    {
        // Order: slip_generation (highest) -> python_requests -> default
        return 'slip_generation,python_requests,ml_processing,default,notifications';
    }
    
    /**
     * Dispatch a slip generation job with proper queue
     */
    public static function dispatchSlipJob($job, $masterSlipId, $predictionType = 'monte_carlo', $riskProfile = 'medium')
    {
        return $job::dispatch($masterSlipId, $predictionType, $riskProfile)
            ->onQueue('slip_generation')
            ->delay(now()->addSeconds(5)); // Small delay for better batching
    }
    
    /**
     * Check if queue worker is running
     */
    public static function isWorkerRunning(): bool
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $output = shell_exec('tasklist | findstr "php" | findstr "queue:work"');
            return !empty($output);
        }
        
        // Linux/Mac
        $output = shell_exec('ps aux | grep "[q]ueue:work"');
        return !empty($output);
    }
    
    /**
     * Get queue statistics
     */
    public static function getQueueStats(): array
    {
        return [
            'connection' => config('queue.default'),
            'worker_running' => self::isWorkerRunning(),
            'queues' => [
                'slip_generation' => \DB::table('jobs')->where('queue', 'slip_generation')->count(),
                'python_requests' => \DB::table('jobs')->where('queue', 'python_requests')->count(),
                'ml_processing' => \DB::table('jobs')->where('queue', 'ml_processing')->count(),
                'default' => \DB::table('jobs')->where('queue', 'default')->count(),
            ],
            'total_jobs' => \DB::table('jobs')->count(),
            'failed_jobs' => \DB::table('failed_jobs')->count(),
        ];
    }
}