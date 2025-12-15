<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Outcome;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class MarketController extends Controller
{
    /**
     * Display a listing of markets.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get pagination parameter from request or use default
            $perPage = $request->get('per_page', 15);
            
            // Query markets with optional search/filter
            $query = Market::query();
            
            // Apply search filter if provided
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }
            
            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Paginate results
            $markets = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $markets->items(),
                'meta' => [
                    'current_page' => $markets->currentPage(),
                    'last_page' => $markets->lastPage(),
                    'per_page' => $markets->perPage(),
                    'total' => $markets->total(),
                ],
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve markets',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Store a newly created market.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request based on existing market schema
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:markets,name',
                'description' => 'nullable|string',
                // Add other fields that exist in markets table
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            // Create market with only validated fields
            $market = Market::create($validator->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Market created successfully',
                'data' => $market,
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create market',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified market.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $market = Market::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $market,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Market not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve market',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update the specified market.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $market = Market::findOrFail($id);
            
            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255|unique:markets,name,' . $id,
                'description' => 'nullable|string',
                // Add other updatable fields
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            // Update market with validated fields
            $market->update($validator->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Market updated successfully',
                'data' => $market,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Market not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update market',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove the specified market.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $market = Market::findOrFail($id);
            
            // Check if market has outcomes before deleting
            if ($market->outcomes()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete market with existing outcomes',
                ], 422);
            }
            
            // Check if using soft deletes (if Market uses SoftDeletes trait)
            if (method_exists($market, 'delete')) {
                $market->delete();
                $message = 'Market deleted successfully';
            } else {
                $market->forceDelete();
                $message = 'Market permanently deleted';
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Market not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete market',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get outcomes for a specific market.
     */
    public function outcomes(string $marketId): JsonResponse
    {
        try {
            $market = Market::findOrFail($marketId);
            
            // Use the relationship to get outcomes
            $outcomes = $market->outcomes()->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'market' => $market,
                    'outcomes' => $outcomes,
                ],
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Market not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve market outcomes',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}