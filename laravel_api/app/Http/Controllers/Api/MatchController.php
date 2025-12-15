<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchRequest;
use App\Http\Requests\UpdateMatchRequest;
use App\Models\MatchModel;
use App\Models\Team;
use App\Models\Team_Form;
use App\Models\Head_To_Head;
use App\Services\TeamService;
use App\Jobs\ProcessMatchForML;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            $query = MatchModel::with(['homeTeam', 'awayTeam', 'headToHead', 'teamForms']);

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
        DB::beginTransaction();

        try {
            // Resolve teams using the service
            $homeTeam = $this->teamService->resolveTeam($request->home_team, $request->league);
            $awayTeam = $this->teamService->resolveTeam($request->away_team, $request->league);

            // Prepare match data
            $matchData = $this->prepareMatchData($request, $homeTeam, $awayTeam);

            // Create match
            $match = MatchModel::create($matchData);

            // Store team forms if provided
            $this->storeTeamForms($match, $homeTeam, $awayTeam, $request);

            // Store head-to-head if provided
            $this->storeHeadToHead($match, $request);

            DB::commit();

            // Dispatch ML processing job
            ProcessMatchForML::dispatch($match->id);

            Log::info('Match created successfully', ['match_id' => $match->id]);

            return response()->json([
                'success' => true,
                'message' => 'Match created successfully',
                'data' => $match->load(['homeTeam', 'awayTeam', 'teamForms', 'headToHead']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create match', [
                'error' => $e->getMessage(),
                'request_data' => $request->except(['home_team_form', 'away_team_form', 'head_to_head_stats']),
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
            $match = MatchModel::with([
                'homeTeam',
                'awayTeam',
                'headToHead',
                'teamForms',
                'predictions'
            ])->findOrFail($id);

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
            if ($request->has('home_team_form') || $request->has('away_team_form')) {
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
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'league' => trim($request->league),
            'competition' => $request->competition,
            'match_date' => $request->match_date,
            'match_time' => $request->match_time,
            'venue' => $request->venue,
            'weather_conditions' => $request->weather_conditions,
            'referee' => $request->referee,
            'importance' => $request->importance,
            'tv_coverage' => $request->tv_coverage,
            'predicted_attendance' => (int) $request->predicted_attendance,
            'odds' => $request->odds,
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
        if ($request->filled('home_team_form')) {
            Team_Form::create([
                'match_id' => $match->id,
                'team_id' => $homeTeam->code,
                'venue' => 'home',
                'form_string' => $request->home_team_form['form_string'] ?? '',
                'matches_played' => (int) ($request->home_team_form['matches_played'] ?? 0),
                'wins' => (int) ($request->home_team_form['wins'] ?? 0),
                'draws' => (int) ($request->home_team_form['draws'] ?? 0),
                'losses' => (int) ($request->home_team_form['losses'] ?? 0),
                'avg_goals_scored' => (float) ($request->home_team_form['avg_goals_scored'] ?? 0),
                'avg_goals_conceded' => (float) ($request->home_team_form['avg_goals_conceded'] ?? 0),
                'form_rating' => (float) ($request->home_team_form['form_rating'] ?? 5),
                'form_momentum' => (float) ($request->home_team_form['form_momentum'] ?? 0),
                'raw_form' => $request->home_team_form['raw_form'] ?? [],
            ]);
        }

        if ($request->filled('away_team_form')) {
            Team_Form::create([
                'match_id' => $match->id,
                'team_id' => $awayTeam->code,
                'venue' => 'away',
                'form_string' => $request->away_team_form['form_string'] ?? '',
                'matches_played' => (int) ($request->away_team_form['matches_played'] ?? 0),
                'wins' => (int) ($request->away_team_form['wins'] ?? 0),
                'draws' => (int) ($request->away_team_form['draws'] ?? 0),
                'losses' => (int) ($request->away_team_form['losses'] ?? 0),
                'avg_goals_scored' => (float) ($request->away_team_form['avg_goals_scored'] ?? 0),
                'avg_goals_conceded' => (float) ($request->away_team_form['avg_goals_conceded'] ?? 0),
                'form_rating' => (float) ($request->away_team_form['form_rating'] ?? 5),
                'form_momentum' => (float) ($request->away_team_form['form_momentum'] ?? 0),
                'raw_form' => $request->away_team_form['raw_form'] ?? [],
            ]);
        }
    }

    /**
     * Store head-to-head data from request.
     */
    private function storeHeadToHead(MatchModel $match, $request): void
    {
        if ($request->filled('head_to_head_stats')) {
            Head_To_Head::create([
                'match_id' => $match->id,
                'stats' => $request->head_to_head_stats,
                'home_wins' => (int) ($request->head_to_head_stats['home_wins'] ?? 0),
                'away_wins' => (int) ($request->head_to_head_stats['away_wins'] ?? 0),
                'draws' => (int) ($request->head_to_head_stats['draws'] ?? 0),
                'total_meetings' => (int) ($request->head_to_head_stats['home_wins'] ?? 0) +
                    (int) ($request->head_to_head_stats['away_wins'] ?? 0) +
                    (int) ($request->head_to_head_stats['draws'] ?? 0),
            ]);
        }
    }

    /**
     * Update team forms.
     */
    private function updateTeamForms(MatchModel $match, $request): void
    {
        if ($request->has('home_team_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'venue' => 'home',
                ],
                [
                    'team_id' => $match->homeTeam->code,
                    'form_string' => $request->home_team_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->home_team_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->home_team_form['wins'] ?? 0),
                    'draws' => (int) ($request->home_team_form['draws'] ?? 0),
                    'losses' => (int) ($request->home_team_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->home_team_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->home_team_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->home_team_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->home_team_form['form_momentum'] ?? 0),
                    'raw_form' => $request->home_team_form['raw_form'] ?? [],
                ]
            );
        }

        if ($request->has('away_team_form')) {
            Team_Form::updateOrCreate(
                [
                    'match_id' => $match->id,
                    'venue' => 'away',
                ],
                [
                    'team_id' => $match->awayTeam->code,
                    'form_string' => $request->away_team_form['form_string'] ?? '',
                    'matches_played' => (int) ($request->away_team_form['matches_played'] ?? 0),
                    'wins' => (int) ($request->away_team_form['wins'] ?? 0),
                    'draws' => (int) ($request->away_team_form['draws'] ?? 0),
                    'losses' => (int) ($request->away_team_form['losses'] ?? 0),
                    'avg_goals_scored' => (float) ($request->away_team_form['avg_goals_scored'] ?? 0),
                    'avg_goals_conceded' => (float) ($request->away_team_form['avg_goals_conceded'] ?? 0),
                    'form_rating' => (float) ($request->away_team_form['form_rating'] ?? 5),
                    'form_momentum' => (float) ($request->away_team_form['form_momentum'] ?? 0),
                    'raw_form' => $request->away_team_form['raw_form'] ?? [],
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
        $criticalFields = ['home_team_id', 'away_team_id', 'match_date', 'odds', 'league'];

        foreach ($criticalFields as $field) {
            if ($request->has($field) && $request->$field != $match->getOriginal($field)) {
                return true;
            }
        }

        return false;
    }
}