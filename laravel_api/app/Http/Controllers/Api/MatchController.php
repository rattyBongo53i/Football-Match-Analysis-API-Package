<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchRequest;
use App\Http\Requests\UpdateMatchRequest;
use App\Models\MatchModel;
use App\Models\Team;
use App\Models\Team_Form;
use App\Models\Market;
use App\Models\MatchMarket;
use App\Models\MasterSlip;
use App\Models\AlternativeSlip;
use App\Models\MatchMarketOutcome;
use App\Models\Head_To_Head;
use App\Services\TeamService;
use App\Jobs\ProcessMatchForML;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MatchController extends Controller
{
    protected TeamService $teamService;

    public function __construct(TeamService $teamService)
    {
        $this->teamService = $teamService;
    }

    /**
     * Display a listing of matches.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MatchModel::query()
                ->select([
                    'id',
                    'home_team',           // ← string name (denormalized)
                    'away_team',           // ← string name (denormalized)
                    'league',
                    'match_date',
                    'status',
                    'home_score',
                    'away_score',
                    'analysis_status',
                    'prediction_ready',
                    'created_at',
                    'updated_at'
                ])
                // ->with([
                //     'headToHead',     // optional: keep if you want H2H summary
                //     'teamForms',      // optional: keep if you want form count/stats
                // ])
                ->withCount('markets as markets_count'); // ← shows number of markets

            // Apply filters
            if ($request->has('league')) {
                $query->where('league', $request->league);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from')) {
                $query->whereDate('match_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('match_date', '<=', $request->date_to);
            }

            if ($request->has('prediction_ready')) {
                $query->where('prediction_ready', $request->boolean('prediction_ready'));
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $matches = $query->latest('match_date')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $matches->items(),
                'meta' => [
                    'current_page' => $matches->currentPage(),
                    'last_page' => $matches->lastPage(),
                    'per_page' => $matches->perPage(),
                    'total' => $matches->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve matches', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve matches',
            ], 500);
        }
    }

    /**
     * Store a newly created match.
     */
    public function store(StoreMatchRequest $request): JsonResponse
    {
        set_time_limit(60);

        // return all request data in json 
        // return response()->json($request->all());

        $start = microtime(true);
        Log::info('store started');

        DB::beginTransaction();

        try {
            // Resolve teams using the service
            $homeTeam = $this->teamService->resolveTeam($request->home_team, $request->league);
            $awayTeam = $this->teamService->resolveTeam($request->away_team, $request->league);

            $teamResolveTime = microtime(true);
            Log::info('Teams resolved', ['time' => $teamResolveTime - $start]);

            // Prepare match data
            $matchData = $this->prepareMatchData($request, $homeTeam, $awayTeam);

            // Create match
            $match = MatchModel::create($matchData);

            $createTime = microtime(true);
            Log::info('Match created', ['time' => $createTime - $teamResolveTime]);

            // Store team forms if provided
            $this->storeTeamForms($match, $homeTeam, $awayTeam, $request);
            $formsTime = microtime(true);
            Log::info('Forms stored', ['time' => $formsTime - $createTime]);

            // Store head-to-head if provided
            $this->storeHeadToHead($match, $request);
            $h2hTime = microtime(true);
            Log::info('H2H stored', ['time' => $h2hTime - $formsTime]);

            DB::commit();

            // Dispatch ML processing job

            Log::info('Match created successfully', ['match_id' => $match->id]);

            //store markets for this match
            if ($request->has('markets')) {
                $this->storeMarkets($match->id, $request->markets);

                $marketsTime = microtime(true);
                Log::info('markets stored', ['time' => $marketsTime - $h2hTime]);
            }

            // ProcessMatchForML::dispatch($match->id, 'full');

            return response()->json([
                'success' => true,
                'message' => 'Match created successfully',
                'data' => $match->load(['homeTeam', 'awayTeam', 'teamForms', 'headToHead']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create match', [
                'error' => $e->getMessage(),
                'request_data' => $request->except(['home_form', 'away_form', 'head_to_head_stats']),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create match',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified match.
     */
    public function show(string $id): JsonResponse
    {
        try {

            $match = MatchModel::query()
                ->select([
                    'id',
                    'home_team',           // ← string name (denormalized)
                    'away_team',           // ← string name (denormalized)
                    'league',
                    'match_date',
                    'status',
                    'home_score',
                    'away_score',
                    'analysis_status',
                    'prediction_ready',
                    'created_at',
                    'updated_at'
                ])
                ->with([
                    'headToHead',     // optional: keep if you want H2H summary
                    'teamForms',      // optional: keep if you want form count/stats
                ])->findOrFail($id);
            // ->withCount('markets as markets_count') // ← shows number of markets


            return response()->json([
                'success' => true,
                'data' => $match,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve match', [
                'match_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve match',
            ], 500);
        }
    }

    /**
     * Update the specified match.
     */
    public function update(UpdateMatchRequest $request, string $id): JsonResponse
    {
        DB::beginTransaction();

        try {
            $match = MatchModel::findOrFail($id);

            // Update basic match data
            $matchData = $request->validated();

            // If teams are being updated, resolve them
            if ($request->has('home_team') || $request->has('league')) {
                $homeTeam = $this->teamService->resolveTeam(
                    $request->get('home_team', $match->homeTeam?->name),
                    $request->get('league', $match->league)
                );
                $matchData['home_team_id'] = $homeTeam->id;
            }

            if ($request->has('away_team') || $request->has('league')) {
                $awayTeam = $this->teamService->resolveTeam(
                    $request->get('away_team', $match->awayTeam?->name),
                    $request->get('league', $match->league)
                );
                $matchData['away_team_id'] = $awayTeam->id;
            }

            // Update the match
            $match->update($matchData);

            // Update team forms if provided
            if ($request->has('home_form') || $request->has('away_form')) {
                $this->updateTeamForms($match, $request);
            }

            // Update head-to-head if provided
            if ($request->has('head_to_head_stats')) {
                $this->updateHeadToHead($match, $request);
            }

            DB::commit();

            // If critical fields changed, reprocess for ML
            if ($this->shouldReprocessForML($match, $request)) {
                ProcessMatchForML::dispatch($match->id);
            }

            Log::info('Match updated successfully', ['match_id' => $match->id]);

            return response()->json([
                'success' => true,
                'message' => 'Match updated successfully',
                'data' => $match->fresh(['homeTeam', 'awayTeam', 'teamForms', 'headToHead']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update match', [
                'match_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update match',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove the specified match.
     */
    public function destroy(string $id): JsonResponse
    {
        DB::beginTransaction();

        try {
            $match = MatchModel::findOrFail($id);

            // Check if match can be deleted (no dependent records)
            if ($match->predictions()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete match with existing predictions',
                ], 422);
            }

            $match->delete();

            DB::commit();

            Log::info('Match deleted successfully', ['match_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Match deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to delete match', [
                'match_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete match',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get matches ready for ML processing.
     */
    public function forMlProcessing(Request $request): JsonResponse
    {
        try {
            $query = MatchModel::where('for_ml_training', true)
                ->where('prediction_ready', false)
                ->with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead']);

            $perPage = $request->get('per_page', 50);
            $matches = $query->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $matches->items(),
                'meta' => [
                    'current_page' => $matches->currentPage(),
                    'last_page' => $matches->lastPage(),
                    'per_page' => $matches->perPage(),
                    'total' => $matches->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve ML-ready matches', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve ML-ready matches',
            ], 500);
        }
    }

    /**
     * Prepare match data from request.
     */

    private function prepareMatchData($request, Team $homeTeam, Team $awayTeam): array
    {
        return [
            'home_team' => $homeTeam->name,
            'away_team' => $awayTeam->name,
            'home_id' => $homeTeam->id,
            'away_id' => $awayTeam->id,
            'league' => trim($request->league),
            'competition' => $request->competition ?? trim($request->league),
            'match_date' => $request->match_date,
            'match_time' => $request->match_time,
            'venue' => $request->venue,
            'weather' => $request->weather ?? null,
            'referee' => $request->referee ?? null,
            'importance' => $request->importance ?? null,
            'tv_coverage' => $request->tv_coverage ?? null,
            'predicted_attendance' => (int) ($request->predicted_attendance ?? 0),
            'for_ml_training' => (bool) ($request->for_ml_training ?? true),
            'prediction_ready' => (bool) ($request->prediction_ready ?? false),
            'analysis_status' => 'pending',
            'status' => $request->status ?? 'scheduled',
        ];
    }

    /**
     * Store team forms from request.
     */
    private function storeTeamForms(MatchModel $match, Team $homeTeam, Team $awayTeam, $request): void
    {
        if ($request->filled('home_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'team_id' => $homeTeam->code,
                    'venue' => 'home',
                ],
                [
                    'form_string' => $request->home_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->home_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->home_form['wins'] ?? 0),
                    'draws' => (int) ($request->home_form['draws'] ?? 0),
                    'losses' => (int) ($request->home_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->home_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->home_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->home_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->home_form['form_momentum'] ?? 0),
                    'raw_form' => $request->home_form['raw_form'] ?? [],
                ]
            );
        }

        if ($request->filled('away_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'team_id' => $awayTeam->code,
                    'venue' => 'away',
                ],
                [
                    'form_string' => $request->away_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->away_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->away_form['wins'] ?? 0),
                    'draws' => (int) ($request->away_form['draws'] ?? 0),
                    'losses' => (int) ($request->away_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->away_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->away_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->away_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->home_form['form_momentum'] ?? 0), // Note: typo fix if needed
                    'raw_form' => $request->away_form['raw_form'] ?? [],
                ]
            );
        }
    }

    /**
     * Store markets for a match
     *
     * @param int $matchId
     * @param array $markets
     * @return void
     * @throws \Exception
     */
    private function storeMarkets(int $matchId, array $markets): void
    {
        DB::beginTransaction();

        try {
                    foreach ($markets as $marketData) {
                        // Generate base slug
                        $baseSlug = \Illuminate\Support\Str::slug($marketData['name'] ?? 'unknown');

                        // Check if slug exists and make it unique if needed
                        $slug = $baseSlug;
                        $counter = 1;

                        while (Market::where('slug', $slug)->exists()) {
                            $slug = $baseSlug . '-' . $counter;
                            $counter++;
                        }

                        // Create or find market
                        $market = Market::firstOrCreate(
                            [
                                'name' => $marketData['name'],
                                'market_type' => $marketData['market_type'],
                            ],
                            [
                                'slug' => $slug,
                                'code' => $this->generateMarketCode($marketData['name']),
                                'description' => ucfirst(str_replace('_', ' ', $marketData['name'] ?? '')),
                                'is_active' => true,
                                'sort_order' => $this->getNextSortOrder(),
                            ]
                        );

                        // If market already exists but has different slug, update it
                        if (!$market->wasRecentlyCreated && $market->slug !== $slug) {
                            // Generate a unique slug for this existing market
                            $newSlug = $slug;
                            $counter = 1;
                            while (Market::where('slug', $newSlug)->where('id', '!=', $market->id)->exists()) {
                                $newSlug = $slug . '-' . $counter;
                                $counter++;
                            }
                            $market->update(['slug' => $newSlug]);
                        }

                // OR use firstOrCreate with explicit save
                $market = Market::firstOrNew(
                    [
                        'name' => $marketData['name'],
                        'market_type' => $marketData['market_type'],
                    ]
                );

                // If it's a new record or missing slug, set the attributes
                if ($market->exists === false || empty($market->slug)) {
                    $market->fill([
                        'slug' => $slug,
                        'code' => $this->generateMarketCode($marketData['name']),
                        'description' => ucfirst(str_replace('_', ' ', $marketData['name'] ?? '')),
                        'is_active' => true,
                        'sort_order' => $this->getNextSortOrder(),
                    ]);
                    $market->save();
                }

                // 2. Attach market to match
                $matchMarket = MatchMarket::updateOrCreate(
                    [
                        'match_id' => $matchId,
                        'market_id' => $market->id,
                    ],
                    [
                        'odds' => $marketData['odds'] ?? 0,
                        'market_data' => json_encode([
                            'source' => 'manual',
                            'raw_name' => $marketData['name'],
                        ]),
                        'is_active' => true,
                    ]
                );

                // 3. Store outcomes
                if (!empty($marketData['outcomes']) && is_array($marketData['outcomes'])) {
                    $this->storeMarketOutcomes($matchMarket->id, $marketData['outcomes']);
                }
            }

            DB::commit();

            Log::info('Markets stored for match', [
                'match_id' => $matchId,
                'markets_count' => count($markets),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store markets', [
                'match_id' => $matchId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(), // Add full trace for debugging
            ]);
            throw $e;
        }
    }

    /**
     * Generate a market code from market name
     * 
     * @param string $marketName
     * @return string
     */
    private function generateMarketCode(string $marketName): string
    {
        // Convert to uppercase, replace spaces with underscores, remove special chars
        $code = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '_', $marketName));

        // If code is too long, truncate it
        if (strlen($code) > 50) {
            $code = substr($code, 0, 50);
        }

        return $code;
    }

    /**
     * Get the next sort order for markets
     * 
     * @return int
     */
    private function getNextSortOrder(): int
    {
        $max = Market::max('sort_order');
        return $max ? $max + 1 : 1;
    }

    /**
     * Store outcomes for a match market
     *
     * @param int $matchMarketId
     * @param array $outcomes
     * @return void
     */
    private function storeMarketOutcomes(int $matchMarketId, array $outcomes): void
    {
        Log::info('Storing outcomes', [
            'match_market_id' => $matchMarketId,
            'outcomes_count' => count($outcomes),
            'first_outcome' => $outcomes[0] ?? null,
        ]);

        foreach ($outcomes as $index => $outcomeData) {
            Log::debug('Processing outcome', [
                'index' => $index,
                'data' => $outcomeData,
            ]);

            try {
                $result = MatchMarketOutcome::updateOrCreate(
                    [
                        'match_market_id' => $matchMarketId,
                        'outcome' => $outcomeData['outcome'], // Try this first
                    ],
                    [
                        'label' => $this->generateOutcomeLabel($outcomeData['outcome']),
                        'odds' => $outcomeData['odds'] ?? 0,
                        'sort_order' => $index + 1,
                        'is_default' => $index === 0,
                    ]
                );

                Log::debug('Outcome saved', ['id' => $result->id]);

            } catch (\Exception $e) {
                Log::error('Failed to save outcome', [
                    'error' => $e->getMessage(),
                    'data' => $outcomeData,
                ]);
                throw $e;
            }
        }
    }

    /**
     * Generate a human-readable outcome label
     * 
     * @param string $outcomeName
     * @return string
     */
    private function generateOutcomeLabel(string $outcomeName): string
    {
        $labels = [
            'win' => 'Win',
            'lose' => 'Lose',
            'draw' => 'Draw',
            'over' => 'Over',
            'under' => 'Under',
            'yes' => 'Yes',
            'no' => 'No',
            'home' => 'Home Win',
            'away' => 'Away Win',
            'both_teams_score' => 'Both Teams Score'
        ];

        return $labels[$outcomeName] ?? ucfirst(str_replace('_', ' ', $outcomeName));
    }




    /**
     * Store head-to-head data from request.
     */
    private function storeHeadToHead(MatchModel $match, $request): void
    {
        if ($request->filled('head_to_head_stats')) {
            $stats = $request->head_to_head_stats;

            // Extract and cast values safely
            $homeWins = (int) ($stats['home_wins'] ?? 0);
            $awayWins = (int) ($stats['away_wins'] ?? 0);
            $draws = (int) ($stats['draws'] ?? 0);
            $homeGoals = (int) ($stats['home_goals'] ?? 0);
            $awayGoals = (int) ($stats['away_goals'] ?? 0);  // Fixed typo: 'away_goas' → 'away_goals'
            $last_meetings = $stats['last_meetings'] ?? [];
            $totalMeetings = $homeWins + $awayWins + $draws;

            Head_To_Head::updateOrCreate(
                ['match_id' => $match->id],  // Ensures only one H2H record per match
                [
                    'home_id' => $match->home_team_id,           // Team ID (or code if string)
                    'away_id' => $match->away_team_id,           // Team ID (or code if string)
                    'home_name' => $match->homeTeam?->name ?? $match->home_team,
                    'away_name' => $match->awayTeam?->name ?? $match->away_team,
                    'total_meetings' => $totalMeetings,
                    'home_wins' => $homeWins,
                    'away_wins' => $awayWins,
                    'draws' => $draws,
                    'home_goals' => $homeGoals,
                    'away_goals' => $awayGoals,
                    'stats' => $stats,  // Keep full raw stats for flexibility
                    'last_meetings' => $last_meetings,
                ]
            );
        }
    }

    /**
     * Update team forms.
     */
    private function updateTeamForms(MatchModel $match, $request): void
    {
        if ($request->has('home_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'venue' => 'home',
                ],
                [
                    'team_id' => $match->homeTeam->code,
                    'form_string' => $request->home_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->home_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->home_form['wins'] ?? 0),
                    'draws' => (int) ($request->home_form['draws'] ?? 0),
                    'losses' => (int) ($request->home_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->home_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->home_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->home_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->home_form['form_momentum'] ?? 0),
                    'raw_form' => $request->home_form['raw_form'] ?? [],
                ]
            );
        }

        if ($request->has('away_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'venue' => 'away',
                ],
                [
                    'team_id' => $match->awayTeam->code,
                    'form_string' => $request->away_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->away_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->away_form['wins'] ?? 0),
                    'draws' => (int) ($request->away_form['draws'] ?? 0),
                    'losses' => (int) ($request->away_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->away_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->away_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->away_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->away_form['form_momentum'] ?? 0),
                    'raw_form' => $request->away_form['raw_form'] ?? [],
                ]
            );
        }
    }

    /**
     * Update head-to-head data.
     */
    private function updateHeadToHead(MatchModel $match, $request): void
    {
        if ($request->has('head_to_head_stats')) {
            Head_To_Head::updateOrCreate(
                ['match_id' => $match->id],
                [
                    'stats' => $request->head_to_head_stats,
                    'home_wins' => (int) ($request->head_to_head_stats['home_wins'] ?? 0),
                    'away_wins' => (int) ($request->head_to_head_stats['away_wins'] ?? 0),
                    'draws' => (int) ($request->head_to_head_stats['draws'] ?? 0),
                    'total_meetings' => (int) ($request->head_to_head_stats['home_wins'] ?? 0) +
                        (int) ($request->head_to_head_stats['away_wins'] ?? 0) +
                        (int) ($request->head_to_head_stats['draws'] ?? 0),
                ]
            );
        }
    }

    /**
     * Check if match should be reprocessed for ML.
     */
    private function shouldReprocessForML(MatchModel $match, $request): bool
    {
        $criticalFields = ['home_id', 'away_id', 'match_date', 'odds', 'league'];

        foreach ($criticalFields as $field) {
            if ($request->has($field) && $request->$field != $match->getOriginal($field)) {
                return true;
            }
        }

        return false;
    }


    /**
     * Manually trigger ML processing for a match (user-controlled)
     */
    public function generatePredictionsSingle(string $id): JsonResponse
    {
        try {
            $match = MatchModel::findOrFail($id);

            // Optional: prevent duplicate running
            if (in_array($match->analysis_status, ['processing', 'completed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Analysis already running or completed for this match',
                    'status' => $match->analysis_status,
                ], 409);
            }

            // Update status to show it's processing
            $match->analysis_status = 'processing';
            $match->save();

            // // Dispatch the heavy job in background
            // ProcessMatchForML::dispatch($match->id, 'full')->onQueue('ml-processing');

            Log::info('User triggered ML processing', ['match_id' => $id, 'user_id' => 1]);

            return response()->json([
                'success' => true,
                'message' => 'Analysis started! You will be notified when predictions and slips are ready.',
                'match_id' => $match->id,
                'status' => 'processing',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to trigger ML processing', [
                'match_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to start analysis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // app/Http/Controllers/Api/MatchController.php (add method)
    public function generatePredictions(string $id): JsonResponse
    {
        $match = MatchModel::with(['markets', 'teamForms', 'headToHead'])->find($id);

        if (!$match) {
            return response()->json(['success' => false, 'message' => 'Match not found'], 404);
        }

        $masterSlip = MasterSlip::create([
            'match_id' => $match->id,
            'stake' => 10.00,
            'status' => 'completed',
        ]);

        $markets = $match->markets;

        for ($i = 0; $i < 50; $i++) {
            $numSelections = rand(2, min(6, $markets->count()));
            $selectedMarkets = $markets->random($numSelections);

            $totalOdds = 1.0;
            $selections = [];

            foreach ($selectedMarkets as $market) {
                $odds = round(rand(120, 450) / 100, 2);
                $totalOdds *= $odds;

                $selections[] = [
                    'market_id' => $market->id,
                    'odds' => $odds,
                ];
            }

            $potentialReturn = round($totalOdds * $masterSlip->stake, 2);

            AlternativeSlip::create([
                'master_slip_id' => $masterSlip->id,
                'total_odds' => round($totalOdds, 2),
                'potential_return' => $potentialReturn,
                'selections' => $selections,
            ]);
        }

        $match->analysis_status = 'completed';
        $match->save();

        return response()->json([
            'success' => true,
            'match_id' => $match->id,
            'master_slip_id' => $masterSlip->id,
            'slips_created' => 50,
            'status' => 'completed',
        ]);
    }

    //Laravel layer can perform several "Orchestrator" tasks:
    //SLA Monitoring: If $processTime exceeds a threshold (e.g., 2.0 seconds), Laravel can
    //trigger an alert that the Python engine is struggling or needs more CPU resources

    //Database Logging: You can save this processing time in your Laravel match_analysis_logs table
    //This helps you track which types of slips (e.g., slips with 20 matches vs 5 matches) take the most computational effort.

    public function generateEngineSlips(Request $request)
    {
        $masterSlipData = $request->master_slip;
        // 1. Send the POST request to the Python Engine
        $response = Http::post('http://localhost:5000/generate-slips', $masterSlipData);

        if ($response->successful()) {
            // 2. Retrieve the custom header we defined in Python
            $processTime = $response->header('X-Process-Time');

            // 3. Log it or store it for performance monitoring
            Log::info("Python Engine processed slip ID {$masterSlipData['master_slip_id']} in {$processTime} seconds.");

            // 4. Return the body (the generated slips)
            return $response->json();
        }

        throw new \Exception("Engine Error: " . $response->body());
    }
}
