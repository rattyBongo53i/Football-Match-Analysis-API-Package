<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SlipController extends Controller
{
    private const MIN_MATCHES_REQUIRED = 1;
    private const MAX_MATCHES_ALLOWED = 50; // Reasonable limit for performance

    /**
     * Get matches for betslip
     * 
     * Endpoint: GET /api/matches/betslip?match_ids=1,2,3,4,5
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getBetslipMatches(Request $request): JsonResponse
    {
        try {
            $validationResult = $this->validateRequest($request);
            if ($validationResult instanceof JsonResponse) {
                return $validationResult;
            }

            $matchIds = $validationResult;
            $validationErrors = $this->validateMatchIds($matchIds);
            
            if ($validationErrors) {
                return $this->errorResponse($validationErrors['message'], $validationErrors['code'], $validationErrors['data'] ?? []);
            }

            $matches = $this->fetchMatchesWithRelations($matchIds);
            $missingMatches = $this->findMissingMatches($matchIds, $matches);

            if (!empty($missingMatches)) {
                return $this->errorResponse(
                    'Some matches not found',
                    404,
                    ['missing_ids' => $missingMatches]
                );
            }

            $transformedMatches = $this->transformMatches($matches);

            return $this->successResponse($transformedMatches);

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
            
        } catch (\Throwable $e) {
            Log::error('Critical error fetching betslip matches', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'match_ids' => $request->match_ids ?? 'not provided'
            ]);
            
            return $this->serverErrorResponse($e);
        }
    }

    /**
     * Validate the incoming request
     */
    private function validateRequest(Request $request): JsonResponse|array
    {
        try {
            $request->validate([
                'match_ids' => [
                    'required',
                    'string',
                    'regex:/^[0-9]+(,[0-9]+)*$/'
                ]
            ]);
            
            return $this->parseMatchIds($request->match_ids);
            
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::warning('Unexpected error during request validation', [
                'error' => $e->getMessage(),
                'match_ids_param' => $request->match_ids
            ]);
            
            return $this->errorResponse('Invalid request format', 400);
        }
    }

    /**
     * Parse and clean match IDs from string
     */
    private function parseMatchIds(string $matchIdsString): array
    {
        $matchIds = explode(',', $matchIdsString);
        
        // Filter out empty strings and non-numeric values
        $matchIds = array_filter($matchIds, function ($id) {
            return is_numeric(trim($id)) && trim($id) !== '';
        });
        
        // Convert to integers and ensure uniqueness
        $matchIds = array_map('intval', $matchIds);
        $matchIds = array_unique($matchIds);
        
        return array_values($matchIds); // Re-index array
    }

    /**
     * Validate match IDs business logic
     */
    private function validateMatchIds(array $matchIds): ?array
    {
        // Check minimum matches
        if (count($matchIds) < self::MIN_MATCHES_REQUIRED) {
            return [
                'message' => 'At least one valid match ID is required',
                'code' => 400,
                'data' => [
                    'min_required' => self::MIN_MATCHES_REQUIRED,
                    'provided' => count($matchIds)
                ]
            ];
        }

        // Check maximum allowed (for performance)
        if (count($matchIds) > self::MAX_MATCHES_ALLOWED) {
            return [
                'message' => 'Too many match IDs requested',
                'code' => 400,
                'data' => [
                    'max_allowed' => self::MAX_MATCHES_ALLOWED,
                    'provided' => count($matchIds)
                ]
            ];
        }

        // Check for invalid IDs
        $invalidIds = array_filter($matchIds, function ($id) {
            return $id <= 0 || $id > PHP_INT_MAX;
        });

        if (!empty($invalidIds)) {
            return [
                'message' => 'Invalid match IDs detected',
                'code' => 400,
                'data' => ['invalid_ids' => array_values($invalidIds)]
            ];
        }

        return null;
    }

    /**
     * Fetch matches with their relations
     */
    private function fetchMatchesWithRelations(array $matchIds)
    {
        try {
            return MatchModel::with([
                'markets' => function ($query) {
                    $query->where('is_active', true)
                          ->orderBy('created_at');
                },
                'markets.outcomes' => function ($query) {
                    $query->orderBy('outcome');
                }
            ])
            ->whereIn('id', $matchIds)
            ->orderBy('match_date')
            ->orderBy('match_time')
            ->get();
            
        } catch (\Exception $e) {
            Log::error('Database error fetching matches', [
                'error' => $e->getMessage(),
                'match_ids' => $matchIds
            ]);
            
            throw new \RuntimeException('Failed to retrieve match data from database', 0, $e);
        }
    }

    /**
     * Find which requested match IDs are missing from results
     */
    private function findMissingMatches(array $requestedIds, $matches): array
    {
        $foundIds = $matches->pluck('id')->toArray();
        $missingIds = array_diff($requestedIds, $foundIds);
        
        return array_values($missingIds);
    }

    /**
     * Transform matches for frontend
     */
    private function transformMatches($matches)
    {
        return $matches->map(function ($match) {
            return $this->transformMatchForFrontend($match);
        });
    }

    /**
     * Transform match data for frontend consumption
     */
    private function transformMatchForFrontend(MatchModel $match): array
    {
        try {
            $matchData = [
                'id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'league' => $match->league,
                'match_date' => $match->match_date instanceof \DateTimeInterface 
                    ? $match->match_date->toDateString() 
                    : $match->match_date,
                'match_time' => $match->match_time,
                'venue' => $match->venue,
                'referee' => $match->referee,
                'weather' => $match->weather,
                'status' => $match->status,
                'home_score' => $match->home_score,
                'away_score' => $match->away_score,
                'home_form' => $match->home_form ?? [],
                'away_form' => $match->away_form ?? [],
                'head_to_head' => $match->head_to_head ?? [],
                'notes' => $match->notes,
                'created_at' => $match->created_at instanceof \DateTimeInterface
                    ? $match->created_at->toISOString()
                    : $match->created_at,
                'updated_at' => $match->updated_at instanceof \DateTimeInterface
                    ? $match->updated_at->toISOString()
                    : $match->updated_at
            ];

            $matchData['markets'] = $match->markets->map(function ($market) {
                return $this->transformMarketForFrontend($market);
            });

            return $matchData;

        } catch (\Exception $e) {
            Log::warning('Error transforming match data', [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
            
            // Return minimal data if transformation fails
            return [
                'id' => $match->id,
                'home_team' => $match->home_team,
                'away_team' => $match->away_team,
                'league' => $match->league,
                'error' => 'Failed to load full match details'
            ];
        }
    }

    /**
     * Transform market data for frontend consumption
     */
    private function transformMarketForFrontend(\App\Models\Market $market): array
    {
        $marketData = [
            'id' => $market->id,
            'name' => $market->name,
            'market_type' => $market->market_type,
            'odds' => (float) $market->odds,
            'is_active' => (bool) $market->is_active,
            'created_at' => $market->created_at instanceof \DateTimeInterface
                ? $market->created_at->toISOString()
                : $market->created_at,
            'updated_at' => $market->updated_at instanceof \DateTimeInterface
                ? $market->updated_at->toISOString()
                : $market->updated_at
        ];

        if ($market->relationLoaded('outcomes') && $market->outcomes->isNotEmpty()) {
            $marketData['outcomes'] = $market->outcomes->map(function ($outcome) {
                return [
                    'outcome' => $outcome->outcome,
                    'odds' => (float) $outcome->odds
                ];
            });
        }

        return $marketData;
    }

    /**
     * Response helper methods
     */
    
    private function successResponse($data, string $message = null): JsonResponse
    {
        $response = ['data' => $data];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        return response()->json($response);
    }

    private function errorResponse(string $message, int $statusCode, array $data = []): JsonResponse
    {
        $response = ['error' => $message];
        
        if (!empty($data)) {
            $response['details'] = $data;
        }
        
        return response()->json($response, $statusCode);
    }

    private function validationErrorResponse(ValidationException $e): JsonResponse
    {
        return response()->json([
            'error' => 'Invalid request parameters',
            'errors' => $e->errors(),
            'message' => $e->getMessage()
        ], 422);
    }

    private function serverErrorResponse(\Throwable $e): JsonResponse
    {
        $response = ['error' => 'Failed to fetch betslip matches'];
        
        // Add detailed error in development
        if (config('app.debug')) {
            $response['debug'] = [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ];
        }
        
        return response()->json($response, 500);
    }
}