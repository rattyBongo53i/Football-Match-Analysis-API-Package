<?php
// app/Http/Controllers/Api/TeamController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Team_Form;
use App\Models\MatchModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeamController extends Controller
{
    /**
     * Get all teams with optional filters
     */
    public function index(Request $request)
    {
        try {
            $query = Team::query();

            // Apply filters
            if ($request->has('country')) {
                $query->where('country', $request->country);
            }

            if ($request->has('league')) {
                $query->where('league', $request->league);
            }

            if ($request->has('is_top_team') && $request->is_top_team) {
                $query->where('is_top_team', true);
            }

            if ($request->has('is_bottom_team') && $request->is_bottom_team) {
                $query->where('is_bottom_team', true);
            }

            if ($request->has('has_home_advantage') && $request->has_home_advantage) {
                $query->where('has_home_advantage', true);
            }

            if ($request->has('is_improving') && $request->is_improving) {
                $query->where('is_improving', true);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'overall_rating');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 20);
            $teams = $query->paginate($perPage);

            // Add additional statistics
            // $teams->getCollection()->transform(function ($team) {
            //     $team->additional_stats = $this->getAdditionalTeamStats($team);
            //     return $team;
            // });

            return response()->json([
                'success' => true,
                'data' => $teams,
                'stats' => [
                    'total_teams' => Team::count(),
                    'top_teams' => Team::where('is_top_team', true)->count(),
                    'average_rating' => round(Team::avg('overall_rating'), 2),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching teams: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch teams',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created team
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:10',
            'code' => 'required|string|max:5|unique:teams,code',
            'slug' => 'nullable|string|max:255|unique:teams,slug',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'stadium' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            'logo_url' => 'nullable|url|max:500',

            // Ratings (optional, will default to 5.0)
            'overall_rating' => 'nullable|numeric|min:0|max:10',
            'attack_rating' => 'nullable|numeric|min:0|max:10',
            'defense_rating' => 'nullable|numeric|min:0|max:10',
            'home_strength' => 'nullable|numeric|min:0|max:10',
            'away_strength' => 'nullable|numeric|min:0|max:10',

            // Form data
            'current_form' => 'nullable|string|max:10',
            'form_rating' => 'nullable|numeric|min:0|max:10',
            'momentum' => 'nullable|numeric|min:-1|max:1',

            // Advanced metrics
            'expected_goals_for' => 'nullable|numeric|min:0',
            'expected_goals_against' => 'nullable|numeric|min:0',
            'possession_avg' => 'nullable|numeric|min:0|max:100',
            'shots_on_target_avg' => 'nullable|numeric|min:0',
            'clean_sheet_percentage' => 'nullable|numeric|min:0|max:100',
            'conversion_rate' => 'nullable|numeric|min:0|max:100',

            // JSON fields
            'home_stats' => 'nullable|array',
            'away_stats' => 'nullable|array',
            'recent_performances' => 'nullable|array',

            // Betting odds
            'fair_odds_home_win' => 'nullable|numeric|min:1.01|max:100',
            'fair_odds_draw' => 'nullable|numeric|min:1.01|max:100',
            'fair_odds_away_win' => 'nullable|numeric|min:1.01|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Generate slug if not provided
            $slug = $request->slug ?? $this->generateSlug($request->name);

            $team = Team::create([
                'name' => $request->name,
                'short_name' => $request->short_name ?? substr($request->name, 0, 10),
                'code' => strtoupper($request->code),
                'slug' => $slug,
                'country' => $request->country,
                'city' => $request->city,
                'stadium' => $request->stadium,
                'founded_year' => $request->founded_year,
                'logo_url' => $request->logo_url,

                // Ratings (default to 5.0 if not provided)
                'overall_rating' => $request->overall_rating ?? 5.0,
                'attack_rating' => $request->attack_rating ?? 5.0,
                'defense_rating' => $request->defense_rating ?? 5.0,
                'home_strength' => $request->home_strength ?? 5.0,
                'away_strength' => $request->away_strength ?? 5.0,

                // Form data
                'current_form' => $request->current_form,
                'form_rating' => $request->form_rating ?? 5.0,
                'momentum' => $request->momentum ?? 0,

                // Advanced metrics
                'expected_goals_for' => $request->expected_goals_for ?? 0,
                'expected_goals_against' => $request->expected_goals_against ?? 0,
                'possession_avg' => $request->possession_avg ?? 50.0,
                'shots_on_target_avg' => $request->shots_on_target_avg ?? 0,
                'clean_sheet_percentage' => $request->clean_sheet_percentage ?? 0,
                'conversion_rate' => $request->conversion_rate ?? 0,

                // JSON fields
                'home_stats' => $request->home_stats ?? [],
                'away_stats' => $request->away_stats ?? [],
                'recent_performances' => $request->recent_performances ?? [],

                // Betting odds
                'fair_odds_home_win' => $request->fair_odds_home_win,
                'fair_odds_draw' => $request->fair_odds_draw,
                'fair_odds_away_win' => $request->fair_odds_away_win,

                // Set strength indicators
                'is_top_team' => ($request->overall_rating ?? 5.0) >= 7.5,
                'is_bottom_team' => ($request->overall_rating ?? 5.0) <= 4.5,
                'has_home_advantage' => ($request->home_strength ?? 5.0) > (($request->away_strength ?? 5.0) + 0.5),
                'is_improving' => ($request->momentum ?? 0) > 0.3,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Team created successfully',
                'data' => $team
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Team creation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create team',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified team
     */
    public function show($code)
    {
        try {
            $team = Team::where('code', strtoupper($code))->first();

            if (!$team) {
                return response()->json([
                    'success' => false,
                    'message' => 'Team not found'
                ], 404);
            }

            // Get additional stats
            $team->additional_stats = $this->getAdditionalTeamStats($team);

            // Get recent team forms
            $team->recent_forms = Team_Form::where('team_id', $team->code)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            // Get recent matches
            $team->recent_matches = MatchModel::where(function ($query) use ($team) {
                $query->where('home_team_id', $team->id)
                    ->orWhere('away_team_id', $team->id);
            })
                ->orderBy('match_date', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $team
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching team: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch team',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified team
     */
    public function update(Request $request, $code)
    {
        $team = Team::where('code', strtoupper($code))->first();

        if (!$team) {
            return response()->json([
                'success' => false,
                'message' => 'Team not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'short_name' => 'nullable|string|max:10',
            'code' => 'sometimes|string|max:5|unique:teams,code,' . $team->id,
            'slug' => 'nullable|string|max:255|unique:teams,slug,' . $team->id,
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'stadium' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            'logo_url' => 'nullable|url|max:500',

            // Ratings
            'overall_rating' => 'nullable|numeric|min:0|max:10',
            'attack_rating' => 'nullable|numeric|min:0|max:10',
            'defense_rating' => 'nullable|numeric|min:0|max:10',
            'home_strength' => 'nullable|numeric|min:0|max:10',
            'away_strength' => 'nullable|numeric|min:0|max:10',

            // Stats
            'matches_played' => 'nullable|integer|min:0',
            'wins' => 'nullable|integer|min:0',
            'draws' => 'nullable|integer|min:0',
            'losses' => 'nullable|integer|min:0',
            'goals_scored' => 'nullable|integer|min:0',
            'goals_conceded' => 'nullable|integer|min:0',
            'goal_difference' => 'nullable|integer',
            'points' => 'nullable|integer|min:0',
            'league_position' => 'nullable|integer|min:1',

            // Form data
            'current_form' => 'nullable|string|max:10',
            'form_rating' => 'nullable|numeric|min:0|max:10',
            'momentum' => 'nullable|numeric|min:-1|max:1',

            // Advanced metrics
            'expected_goals_for' => 'nullable|numeric|min:0',
            'expected_goals_against' => 'nullable|numeric|min:0',
            'possession_avg' => 'nullable|numeric|min:0|max:100',
            'shots_on_target_avg' => 'nullable|numeric|min:0',
            'clean_sheet_percentage' => 'nullable|numeric|min:0|max:100',
            'conversion_rate' => 'nullable|numeric|min:0|max:100',

            // JSON fields
            'home_stats' => 'nullable|array',
            'away_stats' => 'nullable|array',
            'recent_performances' => 'nullable|array',

            // Betting odds
            'fair_odds_home_win' => 'nullable|numeric|min:1.01|max:100',
            'fair_odds_draw' => 'nullable|numeric|min:1.01|max:100',
            'fair_odds_away_win' => 'nullable|numeric|min:1.01|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $updateData = [];

            // Update fields if provided
            if ($request->has('name'))
                $updateData['name'] = $request->name;
            if ($request->has('short_name'))
                $updateData['short_name'] = $request->short_name;
            if ($request->has('code'))
                $updateData['code'] = strtoupper($request->code);
            if ($request->has('slug'))
                $updateData['slug'] = $request->slug;
            if ($request->has('country'))
                $updateData['country'] = $request->country;
            if ($request->has('city'))
                $updateData['city'] = $request->city;
            if ($request->has('stadium'))
                $updateData['stadium'] = $request->stadium;
            if ($request->has('founded_year'))
                $updateData['founded_year'] = $request->founded_year;
            if ($request->has('logo_url'))
                $updateData['logo_url'] = $request->logo_url;

            // Ratings
            if ($request->has('overall_rating'))
                $updateData['overall_rating'] = $request->overall_rating;
            if ($request->has('attack_rating'))
                $updateData['attack_rating'] = $request->attack_rating;
            if ($request->has('defense_rating'))
                $updateData['defense_rating'] = $request->defense_rating;
            if ($request->has('home_strength'))
                $updateData['home_strength'] = $request->home_strength;
            if ($request->has('away_strength'))
                $updateData['away_strength'] = $request->away_strength;

            // Stats
            if ($request->has('matches_played'))
                $updateData['matches_played'] = $request->matches_played;
            if ($request->has('wins'))
                $updateData['wins'] = $request->wins;
            if ($request->has('draws'))
                $updateData['draws'] = $request->draws;
            if ($request->has('losses'))
                $updateData['losses'] = $request->losses;
            if ($request->has('goals_scored'))
                $updateData['goals_scored'] = $request->goals_scored;
            if ($request->has('goals_conceded'))
                $updateData['goals_conceded'] = $request->goals_conceded;
            if ($request->has('goal_difference'))
                $updateData['goal_difference'] = $request->goal_difference;
            if ($request->has('points'))
                $updateData['points'] = $request->points;
            if ($request->has('league_position'))
                $updateData['league_position'] = $request->league_position;

            // Form data
            if ($request->has('current_form'))
                $updateData['current_form'] = $request->current_form;
            if ($request->has('form_rating'))
                $updateData['form_rating'] = $request->form_rating;
            if ($request->has('momentum'))
                $updateData['momentum'] = $request->momentum;

            // Advanced metrics
            if ($request->has('expected_goals_for'))
                $updateData['expected_goals_for'] = $request->expected_goals_for;
            if ($request->has('expected_goals_against'))
                $updateData['expected_goals_against'] = $request->expected_goals_against;
            if ($request->has('possession_avg'))
                $updateData['possession_avg'] = $request->possession_avg;
            if ($request->has('shots_on_target_avg'))
                $updateData['shots_on_target_avg'] = $request->shots_on_target_avg;
            if ($request->has('clean_sheet_percentage'))
                $updateData['clean_sheet_percentage'] = $request->clean_sheet_percentage;
            if ($request->has('conversion_rate'))
                $updateData['conversion_rate'] = $request->conversion_rate;

            // JSON fields
            if ($request->has('home_stats'))
                $updateData['home_stats'] = $request->home_stats;
            if ($request->has('away_stats'))
                $updateData['away_stats'] = $request->away_stats;
            if ($request->has('recent_performances'))
                $updateData['recent_performances'] = $request->recent_performances;

            // Betting odds
            if ($request->has('fair_odds_home_win'))
                $updateData['fair_odds_home_win'] = $request->fair_odds_home_win;
            if ($request->has('fair_odds_draw'))
                $updateData['fair_odds_draw'] = $request->fair_odds_draw;
            if ($request->has('fair_odds_away_win'))
                $updateData['fair_odds_away_win'] = $request->fair_odds_away_win;

            // Update strength indicators based on updated ratings
            $overallRating = $request->has('overall_rating') ? $request->overall_rating : $team->overall_rating;
            $homeStrength = $request->has('home_strength') ? $request->home_strength : $team->home_strength;
            $awayStrength = $request->has('away_strength') ? $request->away_strength : $team->away_strength;
            $momentum = $request->has('momentum') ? $request->momentum : $team->momentum;

            $updateData['is_top_team'] = $overallRating >= 7.5;
            $updateData['is_bottom_team'] = $overallRating <= 4.5;
            $updateData['has_home_advantage'] = $homeStrength > ($awayStrength + 0.5);
            $updateData['is_improving'] = $momentum > 0.3;

            $team->update($updateData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Team updated successfully',
                'data' => $team->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Team update failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update team',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get team statistics
     */
    public function getStats($code)
    {
        try {
            $team = Team::where('code', strtoupper($code))->first();

            if (!$team) {
                return response()->json([
                    'success' => false,
                    'message' => 'Team not found'
                ], 404);
            }

            $stats = [
                'basic_stats' => [
                    'matches_played' => $team->matches_played,
                    'wins' => $team->wins,
                    'draws' => $team->draws,
                    'losses' => $team->losses,
                    'win_percentage' => $team->matches_played > 0
                        ? round(($team->wins / $team->matches_played) * 100, 1)
                        : 0,
                    'draw_percentage' => $team->matches_played > 0
                        ? round(($team->draws / $team->matches_played) * 100, 1)
                        : 0,
                    'loss_percentage' => $team->matches_played > 0
                        ? round(($team->losses / $team->matches_played) * 100, 1)
                        : 0,
                    'goals_scored' => $team->goals_scored,
                    'goals_conceded' => $team->goals_conceded,
                    'goal_difference' => $team->goal_difference,
                    'points' => $team->points,
                    'avg_points_per_match' => $team->matches_played > 0
                        ? round($team->points / $team->matches_played, 2)
                        : 0,
                ],

                'offensive_stats' => [
                    'avg_goals_scored' => $team->avg_goals_scored,
                    'expected_goals_for' => $team->expected_goals_for,
                    'shots_on_target_avg' => $team->shots_on_target_avg,
                    'conversion_rate' => $team->conversion_rate,
                    'failed_to_score_rate' => $team->matches_played > 0
                        ? round(($team->failed_to_score ?? 0) / $team->matches_played * 100, 1)
                        : 0,
                ],

                'defensive_stats' => [
                    'avg_goals_conceded' => $team->avg_goals_conceded,
                    'expected_goals_against' => $team->expected_goals_against,
                    'clean_sheet_percentage' => $team->clean_sheet_percentage,
                    'both_teams_scored_rate' => $this->calculateBothTeamsScoredRate($team),
                ],

                'possession_stats' => [
                    'possession_avg' => $team->possession_avg,
                    'home_possession' => $team->home_stats['possession'] ?? 0,
                    'away_possession' => $team->away_stats['possession'] ?? 0,
                ],

                'form_stats' => [
                    'current_form' => $team->current_form,
                    'form_rating' => $team->form_rating,
                    'momentum' => $team->momentum,
                    'form_analysis' => $team->form_analysis,
                    'strength_category' => $team->strength_category,
                ],

                'home_away_stats' => [
                    'home' => $team->home_stats ?? [],
                    'away' => $team->away_stats ?? [],
                    'home_win_rate' => $this->calculateHomeWinRate($team),
                    'away_win_rate' => $this->calculateAwayWinRate($team),
                ],

                'ratings' => [
                    'overall' => $team->overall_rating,
                    'attack' => $team->attack_rating,
                    'defense' => $team->defense_rating,
                    'home_strength' => $team->home_strength,
                    'away_strength' => $team->away_strength,
                    'relative_strength' => $this->calculateRelativeStrength($team),
                ],

                'indicators' => [
                    'is_top_team' => $team->is_top_team,
                    'is_bottom_team' => $team->is_bottom_team,
                    'has_home_advantage' => $team->has_home_advantage,
                    'is_improving' => $team->is_improving,
                ],

                'betting_stats' => [
                    'fair_odds_home_win' => $team->fair_odds_home_win,
                    'fair_odds_draw' => $team->fair_odds_draw,
                    'fair_odds_away_win' => $team->fair_odds_away_win,
                    'implied_probabilities' => $this->calculateImpliedProbabilities($team),
                ],
            ];

            // Get recent performances
            $stats['recent_performances'] = $team->recent_performances ?? [];

            // Get form trends
            $stats['form_trends'] = $this->getFormTrends($team);

            // Get performance against team strength
            $stats['strength_analysis'] = $this->getStrengthAnalysis($team);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'team' => [
                    'name' => $team->name,
                    'code' => $team->code,
                    'country' => $team->country,
                    'league_position' => $team->league_position,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching team stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch team statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search teams by name or code
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q');

            if (strlen($query) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $teams = Team::where('name', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->orWhere('short_name', 'like', "%{$query}%")
                ->orderBy('overall_rating', 'desc')
                ->limit(20)
                ->get();

            // Format for autocomplete
            $formattedTeams = $teams->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'code' => $team->code,
                    'short_name' => $team->short_name,
                    'country' => $team->country,
                    'overall_rating' => $team->overall_rating,
                    'form_rating' => $team->form_rating,
                    'current_form' => $team->current_form,
                    'label' => "{$team->name} ({$team->code}) - {$team->country}",
                    'value' => $team->code,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedTeams
            ]);

        } catch (\Exception $e) {
            Log::error('Team search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Search failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import teams
     */
    public function bulkImport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teams' => 'required|array|min:1',
            'teams.*.name' => 'required|string|max:255',
            'teams.*.code' => 'required|string|max:5',
            'teams.*.country' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $created = 0;
            $updated = 0;
            $failed = 0;
            $results = [];

            foreach ($request->teams as $teamData) {
                try {
                    $team = Team::updateOrCreate(
                        ['code' => strtoupper($teamData['code'])],
                        [
                            'name' => $teamData['name'],
                            'short_name' => $teamData['short_name'] ?? substr($teamData['name'], 0, 10),
                            'slug' => $teamData['slug'] ?? $this->generateSlug($teamData['name']),
                            'country' => $teamData['country'] ?? 'Unknown',
                            'overall_rating' => $teamData['overall_rating'] ?? 5.0,
                            'form_rating' => $teamData['form_rating'] ?? 5.0,
                        ]
                    );

                    if ($team->wasRecentlyCreated) {
                        $created++;
                    } else {
                        $updated++;
                    }

                    $results[] = [
                        'code' => $team->code,
                        'name' => $team->name,
                        'status' => $team->wasRecentlyCreated ? 'created' : 'updated',
                    ];

                } catch (\Exception $e) {
                    $failed++;
                    $results[] = [
                        'code' => $teamData['code'] ?? 'unknown',
                        'name' => $teamData['name'] ?? 'unknown',
                        'status' => 'failed',
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk import completed',
                'data' => [
                    'created' => $created,
                    'updated' => $updated,
                    'failed' => $failed,
                    'total' => count($request->teams),
                    'results' => $results,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk import failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Bulk import failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update team statistics after a match
     */
    public function updateMatchStats(Request $request, $code)
    {
        $validator = Validator::make($request->all(), [
            'match_result' => 'required|array',
            'match_result.result' => 'required|in:W,D,L',
            'match_result.goals_scored' => 'required|integer|min:0',
            'match_result.goals_conceded' => 'required|integer|min:0',
            'match_result.venue' => 'required|in:home,away',
            'match_result.opponent_strength' => 'nullable|numeric|min:0|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team = Team::where('code', strtoupper($code))->first();

        if (!$team) {
            return response()->json([
                'success' => false,
                'message' => 'Team not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            $matchResult = $request->match_result;

            // Update basic stats
            $team->matches_played += 1;
            $team->goals_scored += $matchResult['goals_scored'];
            $team->goals_conceded += $matchResult['goals_conceded'];
            $team->goal_difference = $team->goals_scored - $team->goals_conceded;

            // Update win/draw/loss count
            switch ($matchResult['result']) {
                case 'W':
                    $team->wins += 1;
                    $team->points += 3;
                    break;
                case 'D':
                    $team->draws += 1;
                    $team->points += 1;
                    break;
                case 'L':
                    $team->losses += 1;
                    break;
            }

            // Update form string (keep last 5 matches)
            $formChar = $matchResult['result'];
            $currentForm = $team->current_form ?? '';
            $newForm = substr($currentForm . $formChar, -5);
            $team->current_form = $newForm;

            // Update form rating
            $team->form_rating = $this->calculateUpdatedFormRating($team, $matchResult);

            // Update momentum
            $team->momentum = $this->calculateUpdatedMomentum($team, $matchResult);

            // Update venue-specific stats
            $venue = $matchResult['venue'];
            $venueStats = $venue === 'home' ? $team->home_stats : $team->away_stats;
            $venueStats = is_array($venueStats) ? $venueStats : [];

            $venueStats['matches_played'] = ($venueStats['matches_played'] ?? 0) + 1;
            $venueStats['goals_scored'] = ($venueStats['goals_scored'] ?? 0) + $matchResult['goals_scored'];
            $venueStats['goals_conceded'] = ($venueStats['goals_conceded'] ?? 0) + $matchResult['goals_conceded'];

            if ($matchResult['result'] === 'W') {
                $venueStats['wins'] = ($venueStats['wins'] ?? 0) + 1;
            } elseif ($matchResult['result'] === 'D') {
                $venueStats['draws'] = ($venueStats['draws'] ?? 0) + 1;
            } else {
                $venueStats['losses'] = ($venueStats['losses'] ?? 0) + 1;
            }

            if ($venue === 'home') {
                $team->home_stats = $venueStats;
                $team->home_strength = $this->calculateVenueStrength($venueStats);
            } else {
                $team->away_stats = $venueStats;
                $team->away_strength = $this->calculateVenueStrength($venueStats);
            }

            // Update overall rating based on performance
            $team->overall_rating = $this->calculateUpdatedOverallRating($team, $matchResult);

            // Update strength indicators
            $team->is_top_team = $team->overall_rating >= 7.5;
            $team->is_bottom_team = $team->overall_rating <= 4.5;
            $team->has_home_advantage = $team->home_strength > ($team->away_strength + 0.5);
            $team->is_improving = $team->momentum > 0.3;

            $team->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Team stats updated successfully',
                'data' => $team->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Team stats update failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update team stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teams with best form
     */
    public function bestForm(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            $minMatches = $request->get('min_matches', 5);

            $teams = Team::where('matches_played', '>=', $minMatches)
                ->orderBy('form_rating', 'desc')
                ->orderBy('momentum', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $teams
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching best form teams: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch teams with best form',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper Methods
     */

    private function generateSlug($name)
    {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    }

    private function getAdditionalTeamStats($team)
    {
        return [
            'win_percentage' => $team->matches_played > 0
                ? round(($team->wins / $team->matches_played) * 100, 1)
                : 0,
            'draw_percentage' => $team->matches_played > 0
                ? round(($team->draws / $team->matches_played) * 100, 1)
                : 0,
            'loss_percentage' => $team->matches_played > 0
                ? round(($team->losses / $team->matches_played) * 100, 1)
                : 0,
            'avg_goals_scored' => $team->matches_played > 0
                ? round($team->goals_scored / $team->matches_played, 2)
                : 0,
            'avg_goals_conceded' => $team->matches_played > 0
                ? round($team->goals_conceded / $team->matches_played, 2)
                : 0,
            'avg_points_per_match' => $team->matches_played > 0
                ? round($team->points / $team->matches_played, 2)
                : 0,
        ];
    }

    private function calculateBothTeamsScoredRate($team)
    {
        // This would require additional data tracking
        // For now, return a placeholder calculation
        return $team->matches_played > 0
            ? round(($team->goals_scored > 0 && $team->goals_conceded > 0 ? $team->matches_played * 0.6 : 0) / $team->matches_played * 100, 1)
            : 0;
    }

    private function calculateHomeWinRate($team)
    {
        $homeStats = $team->home_stats ?? [];
        $homeMatches = $homeStats['matches_played'] ?? 0;
        $homeWins = $homeStats['wins'] ?? 0;

        return $homeMatches > 0 ? round(($homeWins / $homeMatches) * 100, 1) : 0;
    }

    private function calculateAwayWinRate($team)
    {
        $awayStats = $team->away_stats ?? [];
        $awayMatches = $awayStats['matches_played'] ?? 0;
        $awayWins = $awayStats['wins'] ?? 0;

        return $awayMatches > 0 ? round(($awayWins / $awayMatches) * 100, 1) : 0;
    }

    private function calculateRelativeStrength($team)
    {
        // Calculate relative strength compared to average (5.0)
        $relative = ($team->overall_rating - 5.0) / 5.0;
        return round($relative * 100, 1);
    }

    private function calculateImpliedProbabilities($team)
    {
        $probabilities = [];

        if ($team->fair_odds_home_win) {
            $probabilities['home_win'] = round(1 / $team->fair_odds_home_win * 100, 1);
        }

        if ($team->fair_odds_draw) {
            $probabilities['draw'] = round(1 / $team->fair_odds_draw * 100, 1);
        }

        if ($team->fair_odds_away_win) {
            $probabilities['away_win'] = round(1 / $team->fair_odds_away_win * 100, 1);
        }

        return $probabilities;
    }

    private function getFormTrends($team)
    {
        $form = $team->current_form ?? '';
        if (strlen($form) < 3)
            return [];

        $trends = [];
        $formArray = str_split($form);

        // Calculate points for each segment
        for ($i = 0; $i <= count($formArray) - 3; $i++) {
            $segment = array_slice($formArray, $i, 3);
            $points = $this->calculateFormPoints($segment);
            $trends[] = [
                'matches' => implode('', $segment),
                'points' => $points,
                'avg_points' => round($points / 3, 2),
            ];
        }

        return $trends;
    }

    private function calculateFormPoints($formArray)
    {
        $points = 0;
        foreach ($formArray as $result) {
            switch ($result) {
                case 'W':
                    $points += 3;
                    break;
                case 'D':
                    $points += 1;
                    break;
                case 'L':
                    $points += 0;
                    break;
            }
        }
        return $points;
    }

    private function getStrengthAnalysis($team)
    {
        // This would require tracking opponent strength in matches
        // For now, return basic analysis based on ratings
        return [
            'vs_top_teams' => [
                'matches' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'win_rate' => 0,
            ],
            'vs_bottom_teams' => [
                'matches' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'win_rate' => 0,
            ],
        ];
    }

    private function calculateUpdatedFormRating($team, $matchResult)
    {
        $currentRating = $team->form_rating ?? 5.0;
        $matchPoints = $matchResult['result'] === 'W' ? 10 : ($matchResult['result'] === 'D' ? 5 : 0);

        // Weighted average with recent match having more weight
        return round(($currentRating * 0.7) + ($matchPoints * 0.3), 2);
    }

    private function calculateUpdatedMomentum($team, $matchResult)
    {
        $currentMomentum = $team->momentum ?? 0;
        $form = $team->current_form ?? '';

        if (strlen($form) < 6)
            return 0;

        $lastThree = substr($form, 0, 3);
        $previousThree = substr($form, 3, 3);

        $lastThreePoints = $this->calculateFormPoints(str_split($lastThree));
        $previousThreePoints = $this->calculateFormPoints(str_split($previousThree));

        $newMomentum = ($lastThreePoints - $previousThreePoints) / 9;

        // Smooth the momentum update
        return round(($currentMomentum * 0.6) + ($newMomentum * 0.4), 3);
    }

    private function calculateVenueStrength($venueStats)
    {
        $matches = $venueStats['matches_played'] ?? 0;
        $wins = $venueStats['wins'] ?? 0;
        $draws = $venueStats['draws'] ?? 0;

        if ($matches === 0)
            return 5.0;

        $winRate = $wins / $matches;
        $drawRate = $draws / $matches;

        // Convert to 0-10 scale
        $strength = ($winRate * 10) + ($drawRate * 5);
        return round(min(10, max(0, $strength)), 2);
    }

    private function calculateUpdatedOverallRating($team, $matchResult)
    {
        $currentRating = $team->overall_rating ?? 5.0;
        $opponentStrength = $matchResult['opponent_strength'] ?? 5.0;

        $matchPerformance = $this->calculateMatchPerformance($matchResult);
        $expectedPerformance = $this->calculateExpectedPerformance($currentRating, $opponentStrength);

        $performanceDifference = $matchPerformance - $expectedPerformance;

        // Update rating based on performance difference
        $updateFactor = 0.2; // How much to adjust based on one match
        $newRating = $currentRating + ($performanceDifference * $updateFactor);

        return round(min(10, max(0, $newRating)), 2);
    }

    private function calculateMatchPerformance($matchResult)
    {
        $goalsScored = $matchResult['goals_scored'];
        $goalsConceded = $matchResult['goals_conceded'];
        $result = $matchResult['result'];

        $performance = 5.0; // Base performance

        // Adjust based on result
        switch ($result) {
            case 'W':
                $performance += 2.5;
                break;
            case 'D':
                $performance += 0.5;
                break;
            case 'L':
                $performance -= 2.0;
                break;
        }

        // Adjust based on goal difference
        $goalDifference = $goalsScored - $goalsConceded;
        if ($goalDifference >= 3) {
            $performance += 2.0;
        } elseif ($goalDifference >= 2) {
            $performance += 1.0;
        } elseif ($goalDifference >= 1) {
            $performance += 0.5;
        } elseif ($goalDifference <= -3) {
            $performance -= 2.0;
        } elseif ($goalDifference <= -2) {
            $performance -= 1.0;
        } elseif ($goalDifference <= -1) {
            $performance -= 0.5;
        }

        return $performance;
    }

    private function calculateExpectedPerformance($teamRating, $opponentRating)
    {
        // Expected performance based on ELO-like calculation
        $ratingDifference = $teamRating - $opponentRating;
        $expectedWinProbability = 1 / (1 + pow(10, -$ratingDifference / 4));

        // Convert probability to performance score (0-10)
        return $expectedWinProbability * 10;
    }
}