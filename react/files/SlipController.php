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
                ->with(['legs' => function($query) {
                    // Order legs for consistent display
                    $query->orderBy('created_at', 'asc');
                }])
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
                'legs' => function($query) {
                    $query->orderBy('created_at', 'asc');
                },
                'masterSlip' => function($query) {
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
                'legs' => $generatedSlip->legs->map(function($leg) {
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
                ->map(function($slip) {
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
}