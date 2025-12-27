<?php

namespace App\Debug;

use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Model;

class FindVenueRelationship
{
    /**
     * Debug all MatchModel queries and relationships
     */
    public static function debug()
    {
        Log::info('=== STARTING VENUE RELATIONSHIP DEBUG ===');

        // Listen to all Eloquent queries
        \DB::listen(function ($query) {
            if (str_contains($query->sql, 'venue')) {
                Log::debug('VENUE QUERY DETECTED', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time' => $query->time,
                    'backtrace' => collect(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 15))
                        ->filter(function ($trace) {
                            // Filter to show only application files
                            return str_contains($trace['file'] ?? '', 'app/') ||
                                str_contains($trace['file'] ?? '', 'vendor/laravel');
                        })
                        ->map(function ($trace) {
                            return [
                                'file' => $trace['file'] ?? '',
                                'line' => $trace['line'] ?? '',
                                'function' => $trace['function'] ?? '',
                                'class' => $trace['class'] ?? '',
                            ];
                        })
                        ->toArray()
                ]);
            }
        });

        // Hook into Model's relation resolution
        Model::macro('getRelationValueDebugged', function ($key) {
            if ($key === 'venue' && get_class($this) === 'App\Models\MatchModel') {
                $backtrace = collect(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 20))
                    ->filter(function ($trace) {
                        // Skip vendor and framework files for clarity
                        return !str_contains($trace['file'] ?? '', 'vendor/laravel/framework') &&
                            !str_contains($trace['file'] ?? '', 'vendor/composer');
                    })
                    ->values();

                Log::critical('🎯 VENUE RELATIONSHIP ACCESS FOUND!', [
                    'match_id' => $this->id,
                    'venue_column_value' => $this->getAttribute('venue'),
                    'source_file' => $backtrace[1]['file'] ?? 'unknown',
                    'source_line' => $backtrace[1]['line'] ?? 'unknown',
                    'source_class' => $backtrace[1]['class'] ?? 'unknown',
                    'source_function' => $backtrace[1]['function'] ?? 'unknown',
                    'call_chain' => $backtrace->map(function ($trace, $index) {
                        if ($index > 10)
                            return null; // Limit depth
                        return sprintf(
                            '%s:%s - %s%s%s()',
                            $trace['file'] ?? '',
                            $trace['line'] ?? '',
                            $trace['class'] ?? '',
                            $trace['type'] ?? '',
                            $trace['function'] ?? ''
                        );
                    })->filter()->toArray()
                ]);

                // Also dump to console for immediate visibility
                dump('VENUE RELATIONSHIP CALLED FROM:');
                dump($backtrace[1]['file'] . ':' . $backtrace[1]['line']);
                dump('Full trace available in logs');
            }

            return $this->getRelationValue($key);
        });

        // Swap the method temporarily
        $originalMethod = new \ReflectionMethod(Model::class, 'getRelationValue');
        Model::macro('getRelationValue', function ($key) {
            return $this->getRelationValueDebugged($key);
        });

        Log::info('=== VENUE DEBUG HOOKS INSTALLED ===');
    }

    /**
     * Quick debug by running the job with tracing
     */
    public static function runJobWithDebug($masterSlipId = 9)
    {
        self::debug();

        // Run your job manually
        $job = new \App\Jobs\GenerateAlternativeSlipsJob($masterSlipId, 'monte_carlo', 'medium');
        $job->handle();
    }
}