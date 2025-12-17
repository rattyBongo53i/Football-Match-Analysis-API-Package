<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatsController extends Controller
{
    /**
     * Get match statistics
     * 
     * Endpoint: GET /api/stats/matches
     * 
     * @return JsonResponse
     */
    public function matches(): JsonResponse
    {
        try {
            // Get total matches
            $totalMatches = MatchModel::count();
            
            // Breakdown by status
            $byStatus = MatchModel::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();
            
            // Breakdown by league (top 10)
            $byLeague = MatchModel::select('league', DB::raw('count(*) as count'))
                ->groupBy('league')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'league')
                ->toArray();
            
            // Recent activity (last 7 days)
            $sevenDaysAgo = now()->subDays(7);
            
            $matchesAdded = MatchModel::where('created_at', '>=', $sevenDaysAgo)
                ->count();
            
            $analysesRun = Job::where('created_at', '>=', $sevenDaysAgo)
                ->count();
            
            // Recent matches added
            $recentMatches = MatchModel::with(['markets'])
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(function ($match) {
                    return [
                        'id' => $match->id,
                        'home_team' => $match->home_team,
                        'away_team' => $match->away_team,
                        'league' => $match->league,
                        'created_at' => $match->created_at->toISOString(),
                        'market_count' => $match->markets->count()
                    ];
                });
            
            return response()->json([
                'data' => [
                    'total_matches' => $totalMatches,
                    'by_status' => $this->normalizeStatusCounts($byStatus),
                    'by_league' => $byLeague,
                    'recent_activity' => [
                        'matches_added_last_7_days' => $matchesAdded,
                        'analyses_run_last_7_days' => $analysesRun
                    ],
                    'recent_matches' => $recentMatches
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching match statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch statistics'
            ], 500);
        }
    }
    
    /**
     * Normalize status counts to include all possible statuses
     * 
     * @param array $statusCounts
     * @return array
     */
    private function normalizeStatusCounts(array $statusCounts): array
    {
        $allStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
        $normalized = [];
        
        foreach ($allStatuses as $status) {
            $normalized[$status] = $statusCounts[$status] ?? 0;
        }
        
        return $normalized;
    }
}