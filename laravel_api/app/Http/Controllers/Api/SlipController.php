<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterSlip;
use App\Models\GeneratedSlip;
use App\Models\GeneratedSlipLeg;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;
use App\Models\MatchModel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;


/**
 * Controller for managing slips and generated slips.
 * Provides API endpoints for frontend slip pages.
 */
class SlipController extends Controller
{
    /**
     * Get all generated slips for a specific master slip.
     *
     * This endpoint fetches all generated slips for a given master slip ID,
     * including their legs (selections) with eager loading for performance.
     *
     * @param string $masterSlipId The UUID or ID of the master slip
     * @return \Illuminate\Http\JsonResponse
     */
    public function getGeneratedSlips(string $masterSlipId)
    {
        try {
            // Find the master slip or return 404
            $masterSlip = MasterSlip::findOrFail($masterSlipId);

            // Load generated slips with their legs
            $generatedSlips = GeneratedSlip::where('master_slip_id', $masterSlipId)
                ->with([
                    'legs' => function ($query) {
                        // Order legs for consistent display
                        $query->orderBy('created_at', 'asc');
                    }
                ])
                ->orderBy('confidence_score', 'desc') // Show highest confidence first
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Generated slips retrieved successfully',
                'data' => [
                    'master_slip_id' => $masterSlipId,
                    'generated_slips' => $generatedSlips,
                    'count' => $generatedSlips->count()
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Master slip not found',
                'error' => 'The requested master slip does not exist.'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve generated slips',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get detailed information for a specific generated slip.
     *
     * This endpoint returns a single generated slip with all its legs
     * and metadata for frontend detail view.
     *
     * @param string $generatedSlipId The UUID or ID of the generated slip
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSlipDetail(string $generatedSlipId)
    {
        try {
            // Find the generated slip with all relationships
            $generatedSlip = GeneratedSlip::with([
                'legs' => function ($query) {
                    $query->orderBy('created_at', 'asc');
                },
                'masterSlip' => function ($query) {
                    // Only load necessary master slip data
                    $query->select(['id', 'stake', 'currency', 'status', 'created_at']);
                }
            ])->findOrFail($generatedSlipId);

            // Format the response for frontend
            $formattedSlip = [
                'slip_id' => $generatedSlip->id,
                'stake' => (float) $generatedSlip->stake,
                'total_odds' => (float) $generatedSlip->total_odds,
                'possible_return' => (float) $generatedSlip->possible_return,
                'risk_level' => $generatedSlip->risk_level,
                'confidence_score' => (float) $generatedSlip->confidence_score,
                'created_at' => $generatedSlip->created_at->toISOString(),
                'legs' => $generatedSlip->legs->map(function ($leg) {
                    return [
                        'match_id' => $leg->match_id,
                        'market' => $leg->market,
                        'selection' => $leg->selection,
                        'odds' => (float) $leg->odds,
                        'created_at' => $leg->created_at->toISOString()
                    ];
                }),
                'master_slip' => $generatedSlip->masterSlip ? [
                    'stake' => (float) $generatedSlip->masterSlip->stake,
                    'currency' => $generatedSlip->masterSlip->currency,
                    'status' => $generatedSlip->masterSlip->status,
                    'created_at' => $generatedSlip->masterSlip->created_at->toISOString()
                ] : null
            ];

            return response()->json([
                'success' => true,
                'message' => 'Slip detail retrieved successfully',
                'data' => $formattedSlip
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Generated slip not found',
                'error' => 'The requested generated slip does not exist.'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slip detail',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a master slip and all its related data.
     *
     * This endpoint permanently deletes a master slip, all its generated slips,
     * and all generated slip legs. Uses database transaction to ensure
     * data integrity and prevent partial deletes.
     *
     * @param string $masterSlipId The UUID or ID of the master slip to delete
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteSlip(string $masterSlipId)
    {
        DB::beginTransaction();

        try {
            // Find the master slip
            $masterSlip = MasterSlip::findOrFail($masterSlipId);

            // Get all generated slip IDs for this master slip
            $generatedSlipIds = GeneratedSlip::where('master_slip_id', $masterSlipId)
                ->pluck('id')
                ->toArray();

            // Delete in correct order to maintain referential integrity
            if (!empty($generatedSlipIds)) {
                // First delete all legs for these generated slips
                GeneratedSlipLeg::whereIn('generated_slip_id', $generatedSlipIds)->delete();

                // Then delete the generated slips
                GeneratedSlip::where('master_slip_id', $masterSlipId)->delete();
            }

            // Finally delete the master slip
            $masterSlip->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Master slip and all related data deleted successfully',
                'data' => [
                    'deleted_master_slip_id' => $masterSlipId,
                    'deleted_generated_slips_count' => count($generatedSlipIds)
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Master slip not found',
                'error' => 'The requested master slip does not exist.'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete slip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get statistics about slips for dashboard display.
     *
     * This endpoint provides summary data including total slips,
     * generated slips count, average legs per slip, and other metrics
     * for frontend dashboards. Uses efficient database queries.
     *
     * @param Request $request Optional filters via query parameters
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSlipsStatistics(Request $request)
    {
        try {
            // Apply optional date filters
            $query = MasterSlip::query();

            if ($request->has('start_date')) {
                $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
                $query->where('created_at', '>=', $startDate);
            }

            if ($request->has('end_date')) {
                $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
                $query->where('created_at', '<=', $endDate);
            }

            // Get master slips with their generated slips count
            $masterSlips = $query->withCount('generatedSlips')->get();

            // Calculate statistics
            $totalMasterSlips = $masterSlips->count();
            $totalGeneratedSlips = $masterSlips->sum('generated_slips_count');

            // Get legs statistics
            $legsQuery = GeneratedSlipLeg::query();

            if ($request->has('start_date')) {
                $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
                $legsQuery->where('created_at', '>=', $startDate);
            }

            if ($request->has('end_date')) {
                $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
                $legsQuery->where('created_at', '<=', $endDate);
            }

            $totalLegs = $legsQuery->count();
            $averageLegsPerSlip = $totalGeneratedSlips > 0 ? $totalLegs / $totalGeneratedSlips : 0;

            // Get generated slips for confidence statistics
            $generatedSlipsQuery = GeneratedSlip::query();

            if ($request->has('start_date')) {
                $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
                $generatedSlipsQuery->where('created_at', '>=', $startDate);
            }

            if ($request->has('end_date')) {
                $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
                $generatedSlipsQuery->where('created_at', '<=', $endDate);
            }

            $confidenceStats = $generatedSlipsQuery->selectRaw(
                'AVG(confidence_score) as avg_confidence, 
                 MIN(confidence_score) as min_confidence, 
                 MAX(confidence_score) as max_confidence'
            )->first();

            // Compile statistics
            $statistics = [
                'master_slips' => [
                    'total' => $totalMasterSlips,
                    'by_status' => $masterSlips->groupBy('status')->map->count()
                ],
                'generated_slips' => [
                    'total' => $totalGeneratedSlips,
                    'avg_per_master_slip' => $totalMasterSlips > 0 ? $totalGeneratedSlips / $totalMasterSlips : 0
                ],
                'legs' => [
                    'total' => $totalLegs,
                    'avg_per_generated_slip' => round($averageLegsPerSlip, 2)
                ],
                'confidence' => [
                    'average' => $confidenceStats->avg_confidence ? round($confidenceStats->avg_confidence, 2) : 0,
                    'minimum' => $confidenceStats->min_confidence ? round($confidenceStats->min_confidence, 2) : 0,
                    'maximum' => $confidenceStats->max_confidence ? round($confidenceStats->max_confidence, 2) : 0
                ],
                'time_period' => [
                    'start_date' => $request->input('start_date'),
                    'end_date' => $request->input('end_date')
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Export slips data to CSV format.
     *
     * This endpoint streams slips data as CSV for download.
     * Includes optional filtering by date range and slip ID.
     * Uses Laravel's StreamedResponse for memory efficiency.
     *
     * @param Request $request Optional filters
     * @return StreamedResponse
     */
    public function exportSlipsToCSV(Request $request)
    {
        try {
            // Build query with optional filters
            $query = GeneratedSlip::query()
                ->with(['legs', 'masterSlip'])
                ->orderBy('created_at', 'desc');

            // Apply master slip ID filter
            if ($request->has('master_slip_id')) {
                $query->where('master_slip_id', $request->input('master_slip_id'));
            }

            // Apply date range filter
            if ($request->has('start_date')) {
                $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
                $query->where('created_at', '>=', $startDate);
            }

            if ($request->has('end_date')) {
                $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
                $query->where('created_at', '<=', $endDate);
            }

            // Define CSV headers
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="slips_export_' . date('Y-m-d_H-i-s') . '.csv"',
            ];

            // Create streamed response for memory efficiency
            return new StreamedResponse(function () use ($query, $request) {
                // Open output stream
                $handle = fopen('php://output', 'w');

                // Write CSV headers
                fputcsv($handle, [
                    'Slip ID',
                    'Master Slip ID',
                    'Stake',
                    'Total Odds',
                    'Possible Return',
                    'Risk Level',
                    'Confidence Score (%)',
                    'Number of Legs',
                    'Created At',
                    'Market',
                    'Selections',
                    'Average Odds per Leg'
                ]);

                // Stream data in chunks for memory efficiency
                $query->chunk(100, function ($slips) use ($handle) {
                    foreach ($slips as $slip) {
                        // Prepare selections and market info
                        $selections = $slip->legs->pluck('selection')->toArray();
                        $markets = $slip->legs->pluck('market')->toArray();
                        $odds = $slip->legs->pluck('odds')->toArray();

                        // Calculate average odds
                        $avgOdds = count($odds) > 0 ? array_sum($odds) / count($odds) : 0;

                        fputcsv($handle, [
                            $slip->id,
                            $slip->master_slip_id,
                            $slip->stake,
                            $slip->total_odds,
                            $slip->possible_return,
                            $slip->risk_level,
                            $slip->confidence_score,
                            $slip->legs->count(),
                            $slip->created_at->toDateTimeString(),
                            implode('; ', array_unique($markets)),
                            implode('; ', $selections),
                            round($avgOdds, 2)
                        ]);
                    }
                });

                fclose($handle);
            }, Response::HTTP_OK, $headers);
        } catch (\Exception $e) {
            // Fallback JSON response if CSV streaming fails
            return response()->json([
                'success' => false,
                'message' => 'Failed to export CSV',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all master slips with basic information.
     *
     * Optional endpoint for frontend to list master slips.
     * Includes generated slips count for quick overview.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllMasterSlips(Request $request)
    {
        try {
            $query = MasterSlip::query()
                ->withCount('generatedSlips')
                ->orderBy('created_at', 'desc');

            // Optional pagination
            $perPage = $request->input('per_page', 20);
            $masterSlips = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Master slips retrieved successfully',
                'data' => $masterSlips
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve master slips',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get recent generated slips for quick view.
     *
     * Optional endpoint for dashboard or recent activity display.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRecentSlips(Request $request)
    {
        try {
            $limit = $request->input('limit', 10);

            $recentSlips = GeneratedSlip::with(['masterSlip', 'legs'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($slip) {
                    return [
                        'id' => $slip->id,
                        'master_slip_id' => $slip->master_slip_id,
                        'stake' => (float) $slip->stake,
                        'total_odds' => (float) $slip->total_odds,
                        'possible_return' => (float) $slip->possible_return,
                        'risk_level' => $slip->risk_level,
                        'confidence_score' => (float) $slip->confidence_score,
                        'legs_count' => $slip->legs->count(),
                        'created_at' => $slip->created_at->toISOString(),
                        'master_slip' => $slip->masterSlip ? [
                            'status' => $slip->masterSlip->status,
                            'stake' => (float) $slip->masterSlip->stake
                        ] : null
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Recent slips retrieved successfully',
                'data' => $recentSlips
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recent slips',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get slip status information.
     *
     * Optional endpoint to check slip processing status.
     * Useful for frontend polling to show progress.
     *
     * @param string $masterSlipId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSlipStatus(string $masterSlipId)
    {
        try {
            $masterSlip = MasterSlip::findOrFail($masterSlipId);

            $generatedSlipsCount = GeneratedSlip::where('master_slip_id', $masterSlipId)->count();

            $status = [
                'master_slip_id' => $masterSlipId,
                'status' => $masterSlip->status,
                'generated_slips_count' => $generatedSlipsCount,
                'last_updated' => $masterSlip->updated_at->toISOString(),
                'is_complete' => $masterSlip->status === 'completed',
                'is_processing' => $masterSlip->status === 'processing',
                'has_generated_slips' => $generatedSlipsCount > 0
            ];

            return response()->json([
                'success' => true,
                'message' => 'Slip status retrieved successfully',
                'data' => $status
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Master slip not found',
                'error' => 'The requested master slip does not exist.'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slip status',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Create a new betslip in the database
     */
    public function createSlip(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'stake' => 'nullable|numeric|min:0',
                'currency' => 'nullable|string|size:3',
            ]);

            $slip = MasterSlip::create([
                'name' => $validated['name'] ?? 'My Betslip',
                'stake' => $validated['stake'] ?? 0,
                'currency' => $validated['currency'] ?? 'USD',
                'status' => 'draft',
                'slip_data' => [], // Add empty array for slip_data
                'user_id' => 1 // Adjust based on your auth
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Betslip created successfully',
                'data' => [
                    'slip_id' => $slip->id,
                    'name' => $slip->name,
                    'created_at' => $slip->created_at->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            // Add detailed error logging
            Log::error('Failed to create slip: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create betslip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error',
                'debug_info' => env('APP_DEBUG') ? [
                    'status_value' => 'active',
                    'table' => 'master_slips'
                ] : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add a match to an existing betslip
     */
    public function addMatchToSlip(Request $request, $slipId)
    {
        try {
            $validated = $request->validate([
                'match_id' => 'required|string',
                'market' => 'nullable|string',
                'selection' => 'nullable|string',
                'odds' => 'nullable|numeric|min:0',
            ]);

            $slip = MasterSlip::findOrFail($slipId);

            // Check if match already exists in slip
            $existingLeg = GeneratedSlipLeg::whereHas('generatedSlip', function ($q) use ($slipId) {
                $q->where('master_slip_id', $slipId);
            })->where('match_id', $validated['match_id'])->first();

            if ($existingLeg) {
                return response()->json([
                    'success' => false,
                    'message' => 'Match already exists in betslip'
                ], Response::HTTP_CONFLICT);
            }

            // Create generated slip if doesn't exist
            $generatedSlip = GeneratedSlip::firstOrCreate(
                ['master_slip_id' => $slipId],
                [
                    'stake' => $slip->stake,
                    'total_odds' => 1.0,
                    'possible_return' => $slip->stake,
                    'risk_level' => 'medium',
                    'confidence_score' => 0.5
                ]
            );

            // Add match leg
            $leg = GeneratedSlipLeg::create([
                'generated_slip_id' => $generatedSlip->id,
                'match_id' => $validated['match_id'],
                'market' => $validated['market'] ?? '1X2',
                'selection' => $validated['selection'] ?? 'home',
                'odds' => $validated['odds'] ?? 1.85,
            ]);

            // Update generated slip odds
            $this->updateSlipOdds($generatedSlip);

            return response()->json([
                'success' => true,
                'message' => 'Match added to betslip',
                'data' => [
                    'slip_id' => $slipId,
                    'match_id' => $validated['match_id'],
                    'leg_id' => $leg->id
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Betslip not found'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add match to betslip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove a match from betslip
     */
    public function removeMatchFromSlip($slipId, $matchId)
    {
        try {
            $slip = MasterSlip::findOrFail($slipId);

            // Find the generated slip
            $generatedSlip = GeneratedSlip::where('master_slip_id', $slipId)->first();

            if (!$generatedSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'No generated slip found'
                ], Response::HTTP_NOT_FOUND);
            }

            // Remove the leg
            $deleted = GeneratedSlipLeg::where('generated_slip_id', $generatedSlip->id)
                ->where('match_id', $matchId)
                ->delete();

            if ($deleted) {
                // Update slip odds after removal
                $this->updateSlipOdds($generatedSlip);

                // Delete generated slip if empty
                if (GeneratedSlipLeg::where('generated_slip_id', $generatedSlip->id)->count() === 0) {
                    $generatedSlip->delete();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Match removed from betslip'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Match not found in betslip'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Betslip not found'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove match from betslip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Helper method to update slip odds
     */
    private function updateSlipOdds(GeneratedSlip $generatedSlip)
    {
        $legs = $generatedSlip->legs;

        if ($legs->isEmpty()) {
            $generatedSlip->update([
                'total_odds' => 1.0,
                'possible_return' => $generatedSlip->stake
            ]);
            return;
        }

        $totalOdds = $legs->reduce(function ($carry, $leg) {
            return $carry * ($leg->odds ?? 1.0);
        }, 1.0);

        $generatedSlip->update([
            'total_odds' => $totalOdds,
            'possible_return' => $generatedSlip->stake * $totalOdds
        ]);
    }

    public function getMasterSlips(Request $request)
    {
        try {
            $query = MasterSlip::query()
                ->withCount(['generatedSlips as matches_count'])
                ->orderBy('created_at', 'desc');

            // Optional: Filter by user if you have authentication
            // if (auth()->check()) {
            //     $query->where('user_id', auth()->id());
            // }

            $slips = $query->get();

            return response()->json([
                'success' => true,
                'message' => 'Master slips retrieved successfully',
                'data' => $slips
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve master slips',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Run ML analysis on slip
     */
    public function analyzeSlip($id)
    {
        try {
            $slip = MasterSlip::findOrFail($id);

            // Check if slip has enough matches
            $matchCount = $slip->matches()->count();
            if ($matchCount < 5 || $matchCount > 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip must have 5-10 matches for analysis'
                ], 400);
            }

            // Update slip status
            $slip->update(['status' => 'processing']);

            // Trigger ML analysis (you'll need to implement this)
            // This could be a queue job, external API call, etc.

            return response()->json([
                'success' => true,
                'message' => 'Analysis started',
                'data' => [
                    'slip_id' => $id,
                    'status' => 'processing'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    // In your SlipController.php
    public function getSlipAnalysis($id)
    {
        try {
            $masterSlip = MasterSlip::with([
                'matches' => function ($query) {
                    $query->with(['markets', 'analysis']);
                },
                'slipMatches',
                'generatedSlips' => function ($query) {
                    $query->orderBy('confidence_score', 'desc')->take(5);
                },
                'user'
            ])->find($id);

            if (!$masterSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip not found'
                ], 404);
            }

            // Calculate comprehensive analytics
            $analytics = $this->calculateSlipAnalytics($masterSlip);

            return response()->json([
                'success' => true,
                'message' => 'Slip analysis retrieved successfully',
                'data' => [
                    'slip' => $masterSlip,
                    'analytics' => $analytics,
                    'recommendations' => $this->generateRecommendations($masterSlip, $analytics),
                    'historical_performance' => $this->getHistoricalPerformance($masterSlip->user_id),
                    'similar_slips' => $this->getSimilarSlips($masterSlip)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get slip analysis: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slip analysis',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    private function calculateSlipAnalytics($masterSlip)
    {
        // Implement comprehensive analytics calculation
        // This should include: confidence scores, risk assessment,
        // market distribution, league analysis, odds analysis, etc.
        return [
            'confidence_score' => $this->calculateConfidenceScore($masterSlip),
            'risk_level' => $this->calculateRiskLevel($masterSlip),
            'market_distribution' => $this->getMarketDistribution($masterSlip),
            'league_distribution' => $this->getLeagueDistribution($masterSlip),
            'odds_analysis' => $this->analyzeOdds($masterSlip),
            'profitability_metrics' => $this->calculateProfitability($masterSlip),
            // ... more analytics
        ];
    }

    public function DagetGeneratedSlips($id)
    {
        try {
            $slips = GeneratedSlip::where('master_slip_id', $id)
                ->with('legs')
                ->orderBy('confidence_score', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Generated slips retrieved',
                'data' => $slips
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve generated slips',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get matches in a slip
     */
    public function getSlipMatches($id)
    {
        try {
            $masterSlip = MasterSlip::with(['matches.markets', 'slipMatches'])->find($id);

            if (!$masterSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Master slip not found'
                ], 404);
            }

            // Format matches with their pivot data (market, selection, odds)
            $formattedMatches = $masterSlip->matches->map(function ($match) use ($masterSlip) {
                // Get the pivot data for this specific match
                $slipMatch = $masterSlip->slipMatches->firstWhere('match_id', $match->id);

                return [
                    'id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'league' => $match->league,
                    'match_date' => $match->match_date?->toISOString(),
                    'status' => $match->status,
                    'home_score' => $match->home_score,
                    'away_score' => $match->away_score,
                    'home_team_id' => $match->home_team_id,
                    'away_team_id' => $match->away_team_id,
                    'competition' => $match->competition,
                    'venue' => $match->venue,
                    'weather_conditions' => $match->weather_conditions,
                    'referee' => $match->referee,
                    // Pivot data from master_slip_matches
                    'pivot' => $slipMatch ? [
                        'id' => $slipMatch->id,
                        'market' => $slipMatch->market,
                        'selection' => $slipMatch->selection,
                        'odds' => (float) $slipMatch->odds,
                        'match_data' => $slipMatch->match_data,
                        'notes' => $slipMatch->notes,
                        'created_at' => $slipMatch->created_at?->toISOString(),
                        'updated_at' => $slipMatch->updated_at?->toISOString(),
                    ] : null,
                    // Markets data
                    'markets' => $match->markets->map(function ($market) {
                        return [
                            'id' => $market->id,
                            'name' => $market->name,
                            'home_odds' => $market->pivot->odds['home'] ?? $market->pivot->odds['1'] ?? null,
                            'draw_odds' => $market->pivot->odds['draw'] ?? $market->pivot->odds['X'] ?? null,
                            'away_odds' => $market->pivot->odds['away'] ?? $market->pivot->odds['2'] ?? null,
                            'is_active' => $market->pivot->is_active ?? true,
                            'market_data' => $market->pivot->market_data ?? [],
                        ];
                    }),
                    'created_at' => $match->created_at?->toISOString(),
                    'updated_at' => $match->updated_at?->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Slip matches retrieved successfully',
                'data' => $formattedMatches
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get slip matches: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve matches',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }


    /**
     * Get slip details with matches
     */
    public function DagetMasterSlipDetail($id)
    {
        try {
            // Try loading relationships separately to isolate the issue
            $masterSlip = MasterSlip::find($id);

            if (!$masterSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip not found'
                ], 404);
            }

            // Load relationships one by one to find which one is causing the issue
            $masterSlip->load([
                'matches' => function ($query) {
                    $query->with('markets');
                }
            ]);

            // Try loading slipMatches separately with proper constraints
            $slipMatches = $masterSlip->slipMatches()->get();

            // Load other relationships
            $masterSlip->load(['generatedSlips', 'user']);

            // Calculate statistics
            $matches = $masterSlip->matches;
            $totalOdds = 1.0;

            // Use the separately loaded slipMatches
            foreach ($slipMatches as $slipMatch) {
                if ($slipMatch->odds) {
                    $totalOdds *= (float) $slipMatch->odds;
                }
            }

            $estimatedPayout = $masterSlip->stake * $totalOdds;

            // Get match details with their pivot data
            $matchDetails = $matches->map(function ($match) use ($slipMatches) {
                // Find the slip match for this match
                $slipMatch = $slipMatches->firstWhere('match_id', $match->id);

                return [
                    'match_id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'league' => $match->league,
                    'match_date' => $match->match_date?->toISOString(),
                    'status' => $match->status,
                    'selection' => $slipMatch->selection ?? null,
                    'market' => $slipMatch->market ?? null,
                    'market_name' => $slipMatch->market_name ?? null,
                    'odds' => $slipMatch->odds ? (float) $slipMatch->odds : null,
                    'prediction' => $match->analysis_prediction ?? null,
                    'home_win_probability' => $match->analysis_home_win_probability ?? null,
                    'draw_probability' => $match->analysis_draw_probability ?? null,
                    'away_win_probability' => $match->analysis_away_win_probability ?? null,
                    'confidence' => $match->analysis_confidence ?? null,
                ];
            });

            // Get generated slips summary
            $generatedSlipsSummary = $masterSlip->generatedSlips->take(5)->map(function ($slip) {
                return [
                    'id' => $slip->id,
                    'total_odds' => (float) $slip->total_odds,
                    'estimated_payout' => (float) $slip->estimated_payout,
                    'confidence_score' => $slip->confidence_score ?? null,
                    'status' => $slip->status,
                    'created_at' => $slip->created_at?->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Slip details retrieved successfully',
                'data' => [
                    'slip' => [
                        'id' => $masterSlip->id,
                        'name' => $masterSlip->name ?? 'Unnamed Slip',
                        'stake' => (float) $masterSlip->stake,
                        'currency' => $masterSlip->currency ?? 'EUR',
                        'status' => $masterSlip->status,
                        'engine_status' => $masterSlip->engine_status,
                        'analysis_quality' => $masterSlip->analysis_quality,
                        'total_odds' => $totalOdds,
                        'estimated_payout' => $estimatedPayout,
                        'matches_count' => $matches->count(),
                        'generated_slips_count' => $masterSlip->generatedSlips()->count(),
                        'created_at' => $masterSlip->created_at?->toISOString(),
                        'updated_at' => $masterSlip->updated_at?->toISOString(),
                    ],
                    'matches' => $matchDetails,
                    'generated_slips_summary' => $generatedSlipsSummary,
                    'statistics' => [
                        'total_matches' => $matches->count(),
                        'average_odds' => $matches->count() > 0 ? $totalOdds / $matches->count() : 0,
                        'potential_payout' => $estimatedPayout,
                        'profit_potential' => $estimatedPayout - $masterSlip->stake,
                        'roi_percentage' => $masterSlip->stake > 0 ? (($estimatedPayout - $masterSlip->stake) / $masterSlip->stake) * 100 : 0,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get slip detail: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slip details',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function DagetMasterSlip($id)
    {
        try {
            $masterSlip = MasterSlip::with(['matches', 'slipMatches', 'generatedSlips'])->find($id);

            if (!$masterSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Slip retrieved successfully',
                'data' => [
                    'id' => $masterSlip->id,
                    'name' => $masterSlip->name ?? 'Unnamed Slip',
                    'stake' => (float) $masterSlip->stake,
                    'currency' => $masterSlip->currency ?? 'EUR',
                    'status' => $masterSlip->status ?? 'draft',
                    'engine_status' => $masterSlip->engine_status ?? 'pending',
                    'analysis_quality' => $masterSlip->analysis_quality ?? 'medium',
                    'notes' => $masterSlip->notes,
                    'slip_data' => $masterSlip->slip_data ?? [],
                    'created_at' => $masterSlip->created_at?->toISOString(),
                    'updated_at' => $masterSlip->updated_at?->toISOString(),
                    'processing_started_at' => $masterSlip->processing_started_at?->toISOString(),
                    'processing_completed_at' => $masterSlip->processing_completed_at?->toISOString(),
                    'total_odds' => (float) $masterSlip->total_odds,
                    'estimated_payout' => (float) $masterSlip->estimated_payout,
                    'matches_count' => $masterSlip->matches()->count(),
                    'generated_slips_count' => $masterSlip->generatedSlips()->count(),
                    'alternative_slips_count' => $masterSlip->alternative_slips_count,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get master slip: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

          /**
     * Add a single match to an existing MasterSlip.
     *
     * This endpoint allows adding one match selection to a master slip.
     * It validates the input, creates a pivot record in master_slip_matches,
     * and optionally recalculates total odds and payout.
     *
     * @param Request $request
     * @param string $masterSlipId The ID of the MasterSlip
     * @return \Illuminate\Http\JsonResponse
     */
    public function addMatchToMasterSlip(Request $request, string $masterSlipId)
    {
        try {
            // Find the MasterSlip or return 404
            $masterSlip = MasterSlip::findOrFail($masterSlipId);

            // Validate incoming match data
            $validated = $request->validate([
                'match_id'   => 'required|integer|exists:matches,id',
                'market'     => 'required|string|max:100',
                'selection'  => 'required|string|max:100',
                'odds'       => 'required|numeric|min:1',
                'match_data' => 'nullable|array', // Optional extra data (e.g., market outcomes)
            ]);

            // Prevent duplicate match in the same slip
            $exists = $masterSlip->matches()->where('match_id', $validated['match_id'])->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'This match is already added to the slip.',
                ], 422);
            }

            // Create the pivot record
            $masterSlip->matches()->attach($validated['match_id'], [
                'market'     => $validated['market'],
                'selection'  => $validated['selection'],
                'odds'       => $validated['odds'],
                'match_data' => $validated['match_data'] ?? [],
            ]);

            // Optional: Recalculate total odds and estimated payout
            // This is a simple product of all odds — adjust if your logic differs
            $allOdds = $masterSlip->matches()->pluck('pivot.odds')->toArray();
            $totalOdds = array_product($allOdds) ?: 1.0;

            $masterSlip->update([
                'total_odds'        => round($totalOdds, 4),
                'estimated_payout'  => round($totalOdds * $masterSlip->stake, 2),
            ]);

            // Reload fresh data with relations
            $masterSlip->load('matches');

            return response()->json([
                'success' => true,
                'message' => 'Match added to slip successfully',
                'data' => [
                    'master_slip' => $masterSlip,
                    'added_match' => [
                        'match_id'   => $validated['match_id'],
                        'market'     => $validated['market'],
                        'selection'  => $validated['selection'],
                        'odds'       => $validated['odds'],
                    ]
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Master slip not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to add match to slip', [
                'master_slip_id' => $masterSlipId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add match to slip',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update an existing master slip.
     *
     * This endpoint updates the details of a master slip, such as name, stake, notes, etc.
     * It returns the updated slip information.

     *
     * @param Request $request
     * @param string $id The UUID or ID of the master slip to update
     * @return \Illuminate\Http\JsonResponse
     */
          /**
     * Unified update endpoint for MasterSlip.
     *
     * This method intelligently handles:
     * - Updating slip metadata (name, stake, currency, notes)
     * - Adding new matches to the slip
     * - Both operations in a single request IF both data types are present
     *
     * It preserves the exact behavior of the previous two separate functions
     * while consolidating them into one clean, atomic endpoint.
     *

     */
    public function updateMasterSlip(Request $request, string $id)
    {
        try {
            $masterSlip = MasterSlip::findOrFail($id);

            // Separate validation rules for different data types
            $slipRules = [
                'name'     => 'sometimes|string|max:255',
                'stake'    => 'sometimes|numeric|min:0',
                'currency' => 'sometimes|string|max:3',
                'notes'    => 'nullable|string',
            ];

            $matchRules = [
                'match_id'   => 'required|integer|exists:matches,id',
                'market'     => 'required|string|max:100',
                'selection'  => 'required|string|max:100',
                'odds'       => 'required|numeric|min:1',
                'match_data' => 'nullable|array',
            ];

            $hasSlipData = $request->hasAny(['name', 'stake', 'currency', 'notes']);
            $hasMatchData = $request->has('match_id');

            // If neither type of data is present, return validation error
            if (!$hasSlipData && !$hasMatchData) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid data provided. Must include slip fields (name, stake, etc.) or match data.',
                ], 422);
            }

            DB::beginTransaction();

            // 1. Handle slip-level updates (if present)
            if ($hasSlipData) {
                $slipValidated = $request->validate($slipRules);
                $masterSlip->update($slipValidated);
            }

            // 2. Handle match addition (if present)
            $addedMatch = null;
            if ($hasMatchData) {
                $matchValidated = $request->validate($matchRules);

                // Prevent duplicate match using the model's relationship
                $exists = $masterSlip->matches()->where('match_id', $matchValidated['match_id'])->exists();
                if ($exists) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'This match is already in the slip.',
                    ], 422);
                }

                // Attach match using the model's belongsToMany relationship
                $masterSlip->matches()->attach($matchValidated['match_id'], [
                    'market'     => $matchValidated['market'],
                    'selection'  => $matchValidated['selection'],
                    'odds'       => $matchValidated['odds'],
                    'match_data' => $matchValidated['match_data'] ?? [],
                ]);

                $addedMatch = [
                    'match_id'  => $matchValidated['match_id'],
                    'market'    => $matchValidated['market'],
                    'selection' => $matchValidated['selection'],
                    'odds'      => $matchValidated['odds'],
                ];

                // Recalculate total odds and payout using model's relationship
                $allOdds = $masterSlip->matches()->pluck('pivot.odds')->toArray();
                $totalOdds = $allOdds ? array_product($allOdds) : 1.0;

                $masterSlip->update([
                    'total_odds'       => round($totalOdds, 4),
                    'estimated_payout' => round($totalOdds * $masterSlip->stake, 2),
                ]);
            }

            // Refresh model with latest data
            $masterSlip->refresh();
            $masterSlip->load(['matches', 'slipMatches', 'generatedSlips']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $hasSlipData && $hasMatchData
                    ? 'Slip updated and match added successfully'
                    : ($hasSlipData ? 'Slip updated successfully' : 'Match added to slip successfully'),
                'data' => [
                    'id' => $masterSlip->id,
                    'name' => $masterSlip->name ?? 'Unnamed Slip',
                    'stake' => (float) $masterSlip->stake,
                    'currency' => $masterSlip->currency ?? 'EUR',
                    'status' => $masterSlip->status ?? 'draft',
                    'engine_status' => $masterSlip->engine_status ?? 'pending',
                    'analysis_quality' => $masterSlip->analysis_quality ?? 'medium',
                    'notes' => $masterSlip->notes,
                    'slip_data' => $masterSlip->slip_data ?? [],
                    'created_at' => $masterSlip->created_at?->toISOString(),
                    'updated_at' => $masterSlip->updated_at?->toISOString(),
                    'processing_started_at' => $masterSlip->processing_started_at?->toISOString(),
                    'processing_completed_at' => $masterSlip->processing_completed_at?->toISOString(),
                    'total_odds' => (float) $masterSlip->total_odds,
                    'estimated_payout' => (float) $masterSlip->estimated_payout,
                    'matches_count' => $masterSlip->matches()->count(),
                    'generated_slips_count' => $masterSlip->generatedSlips()->count(),
                    'alternative_slips_count' => $masterSlip->alternative_slips_count,
                    'added_match' => $addedMatch, // Only present if a match was added
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Slip not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update master slip', [
                'master_slip_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update slip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

        /**
     * Get all active (draft) master slips.
     *
     * This endpoint fetches all master slips with status 'draft',
     * including their relationships for comprehensive data.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function showActiveSlip()
    {
        try {
            // Load all draft slips with relationships
            $activeSlips = MasterSlip::where('status', 'draft')
                ->with(['matches', 'slipMatches', 'generatedSlips'])
                ->get();

            // Format data for each slip
            $formattedSlips = $activeSlips->map(function ($slip) {
                return [
                    'id' => $slip->id,
                    'name' => $slip->name ?? 'Unnamed Slip',
                    'stake' => (float) $slip->stake,
                    'currency' => $slip->currency ?? 'EUR',
                    'status' => $slip->status ?? 'draft',
                    'engine_status' => $slip->engine_status ?? 'pending',
                    'analysis_quality' => $slip->analysis_quality ?? 'medium',
                    'notes' => $slip->notes,
                    'slip_data' => $slip->slip_data ?? [],
                    'created_at' => $slip->created_at?->toISOString(),
                    'updated_at' => $slip->updated_at?->toISOString(),
                    'processing_started_at' => $slip->processing_started_at?->toISOString(),
                    'processing_completed_at' => $slip->processing_completed_at?->toISOString(),
                    'total_odds' => (float) $slip->total_odds,
                    'estimated_payout' => (float) $slip->estimated_payout,
                    'matches_count' => $slip->matches->count(),
                    'generated_slips_count' => $slip->generatedSlips->count(),
                    'alternative_slips_count' => $slip->alternative_slips_count,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Active slips retrieved successfully',
                'data' => $formattedSlips,
                'count' => $formattedSlips->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve active slips: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active slips',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


        /**
     * Get MasterSlip details with matches for frontend dashboard display.
     *
     * Returns only the essential metadata and matches in a clean, easy-to-consume format.
     * Optimized for dashboard rendering.
     *
     * @param string $id The MasterSlip ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardSlip(string $id)
    {
        try {
            $masterSlip = MasterSlip::with(['matches' => function ($query) {
                $query->orderBy('pivot_created_at', 'asc'); // Consistent match order
            }])
            ->findOrFail($id);

            // Transform matches to include pivot data cleanly
            $formattedMatches = $masterSlip->matches->map(function ($match) {
                $pivot = $match->pivot;

                return [
                    'match_id'     => $match->id,
                    'home_team'    => $match->home_team,
                    'away_team'    => $match->away_team,
                    'league'       => $match->league,
                    'match_date'   => $match->match_date?->toISOString(),
                    'status'       => $match->status,
                    'market'       => $pivot->market,
                    'selection'    => $pivot->selection,
                    'odds'         => (float) $pivot->odds,
                    'match_data'   => $pivot->match_data ?? [],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'slip_id'               => $masterSlip->id,
                    'name'                  => $masterSlip->name ?? 'Unnamed Slip',
                    'stake'                 => (float) $masterSlip->stake,
                    'currency'              => $masterSlip->currency ?? 'EUR',
                    'status'                => $masterSlip->status ?? 'draft',
                    'total_odds'            => (float) $masterSlip->total_odds,
                    'estimated_payout'      => (float) $masterSlip->estimated_payout,
                    'matches_count'         => $masterSlip->matches()->count(),
                    'created_at'            => $masterSlip->created_at?->toISOString(),
                    'updated_at'            => $masterSlip->updated_at?->toISOString(),
                    'matches'               => $formattedMatches,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Slip not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch dashboard slip', [
                'slip_id' => $id,
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load slip details',
            ], 500);
        }
    }




    /**
 * Add matches to a master slip
 * 
 * @param Request $request
 * @param int $id Master slip ID
 * @return \Illuminate\Http\JsonResponse
 */
    public function addMatchesToSlip(Request $request, $id)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'stake' => 'required|numeric|min:0',
                'currency' => 'required|string|max:10',
                'name' => 'sometimes|string|max:255',
                'matches' => 'required|array|min:1',
                'matches.*.match_id' => 'required|integer|exists:matches,id',
                'matches.*.market' => 'required|string|max:100',
                'matches.*.market_name' => 'sometimes|string|max:255',
                'matches.*.selection' => 'required|string|max:255',
                'matches.*.odds' => 'required|numeric|min:1.01',
                'matches.*.home_team' => 'sometimes|string|max:255',
                'matches.*.away_team' => 'sometimes|string|max:255',
                'matches.*.league' => 'sometimes|string|max:255',
                'matches.*.match_date' => 'sometimes|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the master slip
            $masterSlip = MasterSlip::find($id);

            if (!$masterSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip not found'
                ], 404);
            }

            // Update basic slip information
            if ($request->has('stake')) {
                $masterSlip->stake = $request->stake;
            }
            if ($request->has('currency')) {
                $masterSlip->currency = $request->currency;
            }
            if ($request->has('name')) {
                $masterSlip->name = $request->name;
            }
            $masterSlip->save();

            // Process each match
            $addedMatches = [];
            foreach ($request->matches as $matchData) {
                $matchId = $matchData['match_id'];

                // Sync the match with pivot data
                $masterSlip->matches()->syncWithoutDetaching([
                    $matchId => [
                        'market' => $matchData['market'],
                        'market_name' => $matchData['market_name'] ?? $matchData['market'],
                        'selection' => $matchData['selection'],
                        'odds' => $matchData['odds'],
                        'updated_at' => now(),
                    ]
                ]);

                // Get match for response
                $match = MatchModel::find($matchId);
                $addedMatches[] = [
                    'match_id' => $matchId,
                    'home_team' => $matchData['home_team'] ?? $match->home_team,
                    'away_team' => $matchData['away_team'] ?? $match->away_team,
                    'league' => $matchData['league'] ?? $match->league,
                    'market' => $matchData['market'],
                    'market_name' => $matchData['market_name'] ?? $matchData['market'],
                    'selection' => $matchData['selection'],
                    'odds' => (float) $matchData['odds'],
                ];
            }

            // Refresh relationships
            $masterSlip->load(['matches', 'generatedSlips', 'user']);

            // Calculate statistics - get pivot data differently
            $matches = $masterSlip->matches;
            $totalOdds = 1.0;

            // Calculate from pivot data
            foreach ($matches as $match) {
                if ($match->pivot->odds) {
                    $totalOdds *= (float) $match->pivot->odds;
                }
            }

            $estimatedPayout = $masterSlip->stake * $totalOdds;

            // Get match details with pivot data
            $matchDetails = $matches->map(function ($match) {
                return [
                    'match_id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'league' => $match->league,
                    'match_date' => $match->match_date?->toISOString(),
                    'status' => $match->status,
                    'selection' => $match->pivot->selection ?? null,
                    'market' => $match->pivot->market ?? null,
                    'market_name' => $match->pivot->market_name ?? null,
                    'odds' => $match->pivot->odds ? (float) $match->pivot->odds : null,
                    'prediction' => $match->analysis_prediction ?? null,
                    'home_win_probability' => $match->analysis_home_win_probability ?? null,
                    'draw_probability' => $match->analysis_draw_probability ?? null,
                    'away_win_probability' => $match->analysis_away_win_probability ?? null,
                    'confidence' => $match->analysis_confidence ?? null,
                ];
            });

            // Get generated slips summary
            $generatedSlipsSummary = $masterSlip->generatedSlips->take(5)->map(function ($slip) {
                return [
                    'id' => $slip->id,
                    'total_odds' => (float) $slip->total_odds,
                    'estimated_payout' => (float) $slip->estimated_payout,
                    'confidence_score' => $slip->confidence_score ?? null,
                    'status' => $slip->status,
                    'created_at' => $slip->created_at?->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Matches added to slip successfully',
                'data' => [
                    'slip' => [
                        'id' => $masterSlip->id,
                        'name' => $masterSlip->name ?? 'Unnamed Slip',
                        'stake' => (float) $masterSlip->stake,
                        'currency' => $masterSlip->currency ?? 'EUR',
                        'status' => $masterSlip->status,
                        'engine_status' => $masterSlip->engine_status,
                        'analysis_quality' => $masterSlip->analysis_quality,
                        'total_odds' => $totalOdds,
                        'estimated_payout' => $estimatedPayout,
                        'matches_count' => $matches->count(),
                        'generated_slips_count' => $masterSlip->generatedSlips()->count(),
                        'created_at' => $masterSlip->created_at?->toISOString(),
                        'updated_at' => $masterSlip->updated_at?->toISOString(),
                    ],
                    'matches' => $matchDetails,
                    'generated_slips_summary' => $generatedSlipsSummary,
                    'statistics' => [
                        'total_matches' => $matches->count(),
                        'average_odds' => $matches->count() > 0 ? $totalOdds / $matches->count() : 0,
                        'potential_payout' => $estimatedPayout,
                        'profit_potential' => $estimatedPayout - $masterSlip->stake,
                        'roi_percentage' => $masterSlip->stake > 0 ? (($estimatedPayout - $masterSlip->stake) / $masterSlip->stake) * 100 : 0,
                    ],
                    'added_matches' => $addedMatches,
                    'added_count' => count($addedMatches)
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to add matches to slip: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to add matches to slip',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }


}

/***
 * 
 * Three Main Tabs:
Matches Tab - View, add, remove matches from slip

Generated Slips Tab - View AI-generated betting alternatives

Slip Details Tab - Edit slip information and quick actions

Key Features:
Real-time Updates - Automatic refresh after actions

Match Management - Add/remove matches with search functionality

ML Analysis - Run analysis when 5-10 matches are added

Progress Tracking - Visual progress bar for slip completion

Generated Slips Grid - View AI-generated alternatives with confidence scores

Mobile Responsive - Works on all devices

Error Handling - Comprehensive error states and messages

Success Feedback - Toast notifications for all actions

User Flow:
User visits /slip/{id} from slips list

Views current matches and status

Adds more matches via dialog

Runs ML analysis when ready (5-10 matches)

Views generated betting alternatives

Edits slip details or deletes slip as needed

This page provides a comprehensive slip management experience that 
integrates perfectly with your existing betslip system while maintaining
consistent styling and user experience patterns.
 */