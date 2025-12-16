<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MarketController extends Controller
{
    /**
     * Get all active markets
     * 
     * Endpoint: GET /api/markets
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            // Get only active markets
            $markets = Market::where('is_active', true)
                ->with('outcomes')
                ->orderBy('name')
                ->get();
            
            // Transform to frontend format
            $transformedMarkets = $markets->map(function ($market) {
                return $this->transformMarket($market);
            });
            
            return response()->json([
                'data' => $transformedMarkets
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching markets', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch markets'
            ], 500);
        }
    }
    
    /**
     * Transform market for frontend consumption
     * 
     * @param Market $market
     * @return array
     */
    private function transformMarket(Market $market): array
    {
        $baseData = [
            'id' => $market->id,
            'name' => $market->name,
            'market_type' => $market->market_type,
            'is_active' => (bool) $market->is_active,
            'created_at' => $market->created_at->toISOString(),
            'updated_at' => $market->updated_at->toISOString()
        ];
        
        // Add display name based on market type
        $baseData['display_name'] = $this->getDisplayName($market->name);
        
        // Add description
        $baseData['description'] = $this->getDescription($market->name);
        
        // Add outcome structure based on market type
        $baseData['outcome_structure'] = $this->getOutcomeStructure($market->name);
        
        // Add odds structure if available
        if ($market->odds) {
            $baseData['odds_structure'] = $market->odds;
        }
        
        // Add outcomes if loaded
        if ($market->relationLoaded('outcomes') && $market->outcomes->isNotEmpty()) {
            $baseData['outcomes'] = $market->outcomes->map(function ($outcome) {
                return [
                    'outcome' => $outcome->outcome,
                    'odds' => (float) $outcome->odds
                ];
            });
        }
        
        return $baseData;
    }
    
    /**
     * Get display name for market
     * 
     * @param string $marketName
     * @return string
     */
    private function getDisplayName(string $marketName): string
    {
        $displayNames = [
            'match_result' => '1X2',
            'over_under_2_5' => 'Over/Under 2.5',
            'both_teams_score' => 'Both Teams to Score',
            'double_chance' => 'Double Chance',
            'correct_score' => 'Correct Score',
            'asian_handicap' => 'Asian Handicap',
            'half_time_full_time' => 'HT/FT'
        ];
        
        return $displayNames[$marketName] ?? ucfirst(str_replace('_', ' ', $marketName));
    }
    
    /**
     * Get description for market
     * 
     * @param string $marketName
     * @return string
     */
    private function getDescription(string $marketName): string
    {
        $descriptions = [
            'match_result' => 'Predict the match result: Home win (1), Draw (X), or Away win (2)',
            'over_under_2_5' => 'Predict whether the total goals in the match will be over or under 2.5',
            'both_teams_score' => 'Predict whether both teams will score at least one goal',
            'double_chance' => 'Predict two possible outcomes from three: 1X (Home or Draw), 12 (Home or Away), X2 (Draw or Away)',
            'correct_score' => 'Predict the exact final score of the match',
            'asian_handicap' => 'Bet with a handicap applied to level the playing field between teams',
            'half_time_full_time' => 'Predict the result at half time and full time'
        ];
        
        return $descriptions[$marketName] ?? 'Betting market for ' . str_replace('_', ' ', $marketName);
    }
    
    /**
     * Get outcome structure for market
     * 
     * @param string $marketName
     * @return array
     */
    private function getOutcomeStructure(string $marketName): array
    {
        $structures = [
            'match_result' => ['1', 'X', '2'],
            'over_under_2_5' => ['Over 2.5', 'Under 2.5'],
            'both_teams_score' => ['Yes', 'No'],
            'double_chance' => ['1X', '12', 'X2'],
            'correct_score' => ['0-0', '1-0', '0-1', '1-1', '2-0', '0-2', '2-1', '1-2', '2-2', '3-0', '0-3', '3-1', '1-3', '3-2', '2-3', '3-3'],
            'asian_handicap' => ['Home', 'Away'],
            'half_time_full_time' => ['1/1', '1/X', '1/2', 'X/1', 'X/X', 'X/2', '2/1', '2/X', '2/2']
        ];
        
        return $structures[$marketName] ?? [];
    }
}