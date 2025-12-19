<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\TeamFormService;
use App\Services\MarketDataService;
use App\Services\HeadToHeadService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
        $this->app->singleton(TeamFormService::class);
        $this->app->singleton(MarketDataService::class);
        $this->app->singleton(HeadToHeadService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
