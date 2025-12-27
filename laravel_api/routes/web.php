<?php

use Illuminate\Support\Facades\Route;
use App\Jobs\GenerateAlternativeSlipsJob;
// use schema, DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/test-queue-setup', function () {
    // Test data
    $testData = [
        'queue_connection' => config('queue.default'),
        'jobs_table_exists' => Schema::hasTable('jobs'),
        'jobs_count' => DB::table('jobs')->count(),
        'failed_jobs_count' => DB::table('failed_jobs')->count(),
    ];

    // Dispatch a test job
    $jobId = GenerateAlternativeSlipsJob::dispatch(
        7, // master slip ID
        'monte_carlo',
        'medium'
    );

    $testData['job_dispatched'] = true;
    $testData['job_id'] = $jobId;

    return $testData;
});

Route::get('/queue-status', function () {
    $status = [];

    // Check connection
    $status['connection'] = config('queue.default');

    // Check tables
    $status['jobs_table'] = Schema::hasTable('jobs') ? 'Exists' : 'Missing';
    $status['failed_jobs_table'] = Schema::hasTable('failed_jobs') ? 'Exists' : 'Missing';

    // Counts
    $status['pending_jobs'] = DB::table('jobs')->count();
    $status['failed_jobs'] = DB::table('failed_jobs')->count();

    // Check worker process
    $status['worker_running'] = exec('ps aux | grep "[q]ueue:work"') ? 'Yes' : 'No';

    // Recent jobs
    $status['recent_jobs'] = DB::table('jobs')
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get()
        ->map(function ($job) {
            return [
                'id' => $job->id,
                'queue' => $job->queue,
                'attempts' => $job->attempts,
                'created_at' => $job->created_at,
            ];
        });

    return $status;
});

Route::get('/debug-venue', function () {
    \App\Debug\FindVenueRelationship::runJobWithDebug(9);
    return 'Debugging complete. Check logs.';
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
