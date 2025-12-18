<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\MatchMarket;
use App\Models\MarketOutcomes;
use App\Models\MarketModel;
use App\Models\MatchModel;
use Symfony\Component\HttpFoundation\Request;

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

        /**
     * Example of how to use the storeMarkets function in your store method
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate the main match data
            $validatedData = $request->validate([
                'home_team' => 'required|string',
                'away_team' => 'required|string',
                'league' => 'required|string',
                'match_date' => 'required|date',
                'match_time' => 'nullable|string',
                'venue' => 'nullable|string',
                // Add other validation rules...
            ]);
            
            // Create the match
            $match = MatchModel::create([
                'home_team' => $validatedData['home_team'],
                'away_team' => $validatedData['away_team'],
                'league' => $validatedData['league'],
                'match_date' => $validatedData['match_date'],
                'venue' => $request->input('venue', 'Home'),
                'status' => $request->input('status', 'scheduled'),
                'home_score' => $request->input('home_score'),
                'away_score' => $request->input('away_score'),
                'home_form' => $request->input('home_form'),
                'away_form' => $request->input('away_form'),
                'head_to_head' => $request->input('head_to_head'),
                // Add other fields...
            ]);
            
            // Store markets if they exist in the request
            if ($request->has('markets') && is_array($request->markets)) {
                $this->storeMarkets($match->id, $request->markets);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Match and markets created successfully',
                'data' => [
                    'match' => $match,
                    'markets' => $match->markets()->get()
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create match and markets',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Alternative: Separate endpoint for adding markets to existing match
     * 
     * @param Request $request
     * @param int $matchId
     * @return \Illuminate\Http\JsonResponse
     */
    public function addMarkets(Request $request, int $matchId)
    {
        try {
            $match = MatchModel::findOrFail($matchId);
            
            $validatedData = $request->validate([
                'markets' => 'required|array',
                'markets.*.name' => 'required|string',
                'markets.*.market_type' => 'required|string',
                'markets.*.odds' => 'nullable|numeric',
                'markets.*.outcomes' => 'nullable|array'
            ]);
            
            $this->storeMarkets($match->id, $validatedData['markets']);
            
            return response()->json([
                'success' => true,
                'message' => 'Markets added successfully',
                'data' => $match->markets()->get()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add markets',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function updateMarkets(Request $request, $id)
    {
        $match = MatchModel::findOrFail($id);
        $this->storeMarkets($match->id, $request->markets);

        return response()->json(['message' => 'Markets updated successfully']);
    }
}