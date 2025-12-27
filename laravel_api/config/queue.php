<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Queue Connection Name
    |--------------------------------------------------------------------------
    |
    | This determines which queue connection Laravel will use by default.
    | For XAMPP + MySQL, this MUST be "database".
    |
    */

    'default' => env('QUEUE_CONNECTION', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Queue Connections
    |--------------------------------------------------------------------------
    */

    'connections' => [

        'sync' => [
            'driver' => 'sync',
        ],

        'database' => [
            'driver' => 'database',
            'connection' => env('DB_CONNECTION', 'mysql'),
            'table' => 'jobs',
            'queue' => 'default',
            'retry_after' => 300, // 5 minutes for long-running Python jobs
            'after_commit' => true, // Wait for database transaction to complete
            'expire' => 3600, // Jobs expire after 1 hour
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => env('REDIS_QUEUE', 'default'),
            'retry_after' => 180,
            'block_for' => null,
            'after_commit' => false,
        ],


    'queues' => [
        // Priority order (highest to lowest)
        'priorities' => [
            'slip_generation',    // User slip creation (highest priority)
            'python_requests',    // Python API calls
            'ml_processing',      // ML model processing
            'default',            // Everything else
            'notifications',      // Email/SMS notifications (lowest)
        ],
        
        // Queue-specific timeouts (seconds)
        'timeouts' => [
            'slip_generation' => 180,    // 3 minutes
            'python_requests' => 120,    // 2 minutes
            'ml_processing' => 300,      // 5 minutes
            'default' => 60,             // 1 minute
        ],
        
        // Retry attempts per queue
        'retries' => [
            'slip_generation' => 3,
            'python_requests' => 3,
            'ml_processing' => 2,
            'default' => 3,
        ],
        
        // Delay between retries (seconds)
        'backoff' => [
            'slip_generation' => [30, 60, 120],
            'python_requests' => [15, 30, 60],
            'ml_processing' => [60, 300],
            'default' => [10, 30, 60],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Batching
    |--------------------------------------------------------------------------
    |
    | For batch slip generation if needed in future
    |
    */

    'batching' => [
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'job_batches',
    ],

    /*
    |--------------------------------------------------------------------------
    | Failed Queue Jobs
    |--------------------------------------------------------------------------
    |
    | Custom failed job configuration for better debugging
    |
    */

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'failed_jobs',
        // Custom failed job handler for your Python jobs
        'handler' => env('QUEUE_FAILED_HANDLER', \Illuminate\Queue\Failed\DatabaseFailedJobHandler::class),
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Monitoring
    |--------------------------------------------------------------------------
    |
    | Enable queue monitoring for your dashboard
    |
    */

    'monitor' => [
        'enabled' => env('QUEUE_MONITOR_ENABLED', true),
        'refresh_interval' => env('QUEUE_MONITOR_REFRESH', 5000), // 5 seconds
        'thresholds' => [
            'warning' => env('QUEUE_MONITOR_WARNING', 100), // Warn at 100 jobs
            'critical' => env('QUEUE_MONITOR_CRITICAL', 500), // Critical at 500 jobs
        ],
    ],

],
];
