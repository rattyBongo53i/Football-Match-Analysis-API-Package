<?php
// app/Http/Controllers/Api/MatchController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use App\Models\Team_Form;
use App\Models\Head_To_Head;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MatchController extends Controller
{
    /**
     * Store a newly created match with all related data
     */
    public function store(Request $request)
    {
        // Validate incoming data
        $validator = Validator::make($request->all(), [
            'home_team' => 'required|string|max:255',
            'away_team' => 'required|string|max:255',
            'home_team_code' => 'nullable|string|max:10',
            'away_team_code' => 'nullable|string|max:10',
            'league' => 'required|string|max:255',
            'competition' => 'nullable|string|max:255',
            'match_date' => 'nullable|date',
            'venue' => 'nullable|string|max:50',
            'match_time' => 'nullable|string|max:10',
            
            // Head to head data
            'head_to_head_summary' => 'nullable|string',
            'head_to_head_stats' => 'nullable|array',
            
            // Team forms
            'home_team_form' => 'nullable|array',
            'away_team_form' => 'nullable|array',
            
            // Odds
            'odds' => 'nullable|array',
            
            // Additional data
            'weather_conditions' => 'nullable|string|max:100',
            'referee' => 'nullable|string|max:100',
            'importance' => 'nullable|string|max:50',
            'tv_coverage' => 'nullable|string|max:100',
            'predicted_attendance' => 'nullable|integer',
            
            // ML flags
            'for_ml_training' => 'nullable|boolean',
            'prediction_ready' => 'nullable|boolean',
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
            // Create or update teams first
            $homeTeam = $this->createOrUpdateTeam([
                'name' => $request->home_team,
                'code' => $request->home_team_code ?? strtoupper(substr($request->home_team, 0, 3)),
                'country' => $this->extractCountryFromLeague($request->league),
            ]);
            
            $awayTeam = $this->createOrUpdateTeam([
                'name' => $request->away_team,
                'code' => $request->away_team_code ?? strtoupper(substr($request->away_team, 0, 3)),
                'country' => $this->extractCountryFromLeague($request->league),
            ]);
            
            // Create match
            $match = MatchModel::create([
                'home_team_id' => $homeTeam->id,
                'away_team_id' => $awayTeam->id,
                'home_team' => $request->home_team,
                'away_team' => $request->away_team,
                'league' => $request->league,
                'competition' => $request->competition,
                'match_date' => $request->match_date,
                'venue' => $request->venue,
                'match_time' => $request->match_time,
                'odds' => $request->odds ?? [],
                'weather_conditions' => $request->weather_conditions,
                'referee' => $request->referee,
                'importance' => $request->importance,
                'tv_coverage' => $request->tv_coverage,
                'predicted_attendance' => $request->predicted_attendance,
                'for_ml_training' => $request->for_ml_training ?? true,
                'prediction_ready' => $request->prediction_ready ?? false,
                'status' => 'pending', // pending, processed, predicted
            ]);
            
            // Create team forms if provided
            if ($request->has('home_team_form') && !empty($request->home_team_form)) {
                $this->createTeamForm($match->id, $homeTeam, 'home', $request->home_team_form);
            }
            
            if ($request->has('away_team_form') && !empty($request->away_team_form)) {
                $this->createTeamForm($match->id, $awayTeam, 'away', $request->away_team_form);
            }
            
            // Create head-to-head data if provided
            if ($request->has('head_to_head_summary') || $request->has('head_to_head_stats')) {
                $this->createHeadToHead($match->id, $request->all());
            }
            
            // Update team statistics based on form data
            $this->updateTeamStatistics($homeTeam, $request->home_team_form ?? []);
            $this->updateTeamStatistics($awayTeam, $request->away_team_form ?? []);
            
            DB::commit();
            
            // Trigger Python processing job
            \App\Jobs\ProcessMatchForML::dispatch($match->id);
            
            return response()->json([
                'success' => true,
                'message' => 'Match created successfully',
                'data' => $match->load(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Match creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create match',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create or update team
     */
    private function createOrUpdateTeam(array $teamData)
    {
        $team = Team::where('code', $teamData['code'])->first();
        
        if (!$team) {
            $team = Team::create([
                'name' => $teamData['name'],
                'code' => $teamData['code'],
                'short_name' => substr($teamData['name'], 0, 10),
                'slug' => strtolower(str_replace(' ', '-', $teamData['name'])),
                'country' => $teamData['country'],
                'overall_rating' => 5.0,
                'attack_rating' => 5.0,
                'defense_rating' => 5.0,
                'home_strength' => 5.0,
                'away_strength' => 5.0,
            ]);
        }
        
        return $team;
    }
    
    /**
     * Create team form record
     */
    private function createTeamForm($matchId, $team, $venue, array $formData)
    {
        $teamForm = Team_Form::updateOrCreate(
            [
                'match_id' => $matchId,
                'team_id' => $team->code,
                'venue' => $venue,
            ],
            [
                'raw_form' => $formData['raw_form'] ?? [],
                'matches_played' => $formData['matches_played'] ?? count($formData['raw_form'] ?? []),
                'wins' => $formData['wins'] ?? 0,
                'draws' => $formData['draws'] ?? 0,
                'losses' => $formData['losses'] ?? 0,
                'goals_scored' => $formData['goals_scored'] ?? 0,
                'goals_conceded' => $formData['goals_conceded'] ?? 0,
                'avg_goals_scored' => $formData['avg_goals_scored'] ?? 0,
                'avg_goals_conceded' => $formData['avg_goals_conceded'] ?? 0,
                'clean_sheets' => $formData['clean_sheets'] ?? 0,
                'failed_to_score' => $formData['failed_to_score'] ?? 0,
                'form_string' => $formData['form_string'] ?? '',
                'form_rating' => $formData['form_rating'] ?? 5.0,
                'form_momentum' => $formData['form_momentum'] ?? 0,
                'opponent_strength' => $formData['opponent_strength'] ?? [],
                'win_probability' => $formData['win_probability'] ?? 0.33,
                'draw_probability' => $formData['draw_probability'] ?? 0.33,
                'loss_probability' => $formData['loss_probability'] ?? 0.34,
            ]
        );
        
        return $teamForm;
    }
    
    /**
     * Create head-to-head record
     */
    private function createHeadToHead($matchId, array $data)
    {
        $headToHead = Head_To_Head::updateOrCreate(
            ['match_id' => $matchId],
            [
                'form' => $this->generateFormString($data['head_to_head_stats'] ?? []),
                'stats' => $data['head_to_head_stats'] ?? [],
                'last_meetings' => [],
                'home_wins' => $data['head_to_head_stats']['home_wins'] ?? 0,
                'away_wins' => $data['head_to_head_stats']['away_wins'] ?? 0,
                'draws' => $data['head_to_head_stats']['draws'] ?? 0,
                'total_meetings' => 
                    ($data['head_to_head_stats']['home_wins'] ?? 0) +
                    ($data['head_to_head_stats']['away_wins'] ?? 0) +
                    ($data['head_to_head_stats']['draws'] ?? 0),
                'last_meeting_date' => null,
                'last_meeting_result' => null,
                'home_goals' => 0,
                'away_goals' => 0,
            ]
        );
        
        return $headToHead;
    }
    
    /**
     * Update team statistics
     */
    private function updateTeamStatistics($team, array $formData)
    {
        if (empty($formData)) return;
        
        $matchesPlayed = $team->matches_played + ($formData['matches_played'] ?? 0);
        $wins = $team->wins + ($formData['wins'] ?? 0);
        $draws = $team->draws + ($formData['draws'] ?? 0);
        $losses = $team->losses + ($formData['losses'] ?? 0);
        
        $goalsScored = $team->goals_scored + ($formData['goals_scored'] ?? 0);
        $goalsConceded = $team->goals_conceded + ($formData['goals_conceded'] ?? 0);
        
        $team->update([
            'matches_played' => $matchesPlayed,
            'wins' => $wins,
            'draws' => $draws,
            'losses' => $losses,
            'goals_scored' => $goalsScored,
            'goals_conceded' => $goalsConceded,
            'goal_difference' => $goalsScored - $goalsConceded,
            'points' => ($wins * 3) + $draws,
            'current_form' => $formData['form_string'] ?? $team->current_form,
            'form_rating' => $formData['form_rating'] ?? $team->form_rating,
            'momentum' => $formData['form_momentum'] ?? $team->momentum,
        ]);
    }
    
    /**
     * Generate form string from stats
     */
    private function generateFormString(array $stats)
    {
        $homeWins = $stats['home_wins'] ?? 0;
        $draws = $stats['draws'] ?? 0;
        $awayWins = $stats['away_wins'] ?? 0;
        
        return "{$homeWins}-{$draws}-{$awayWins}";
    }
    
    /**
     * Extract country from league name
     */
    private function extractCountryFromLeague(string $league)
    {
        $countryMap = [
            'Premier League' => 'England',
            'La Liga' => 'Spain',
            'Serie A' => 'Italy',
            'Bundesliga' => 'Germany',
            'Ligue 1' => 'France',
            'Champions League' => 'Europe',
            'Europa League' => 'Europe',
            'FA Cup' => 'England',
            'EFL Cup' => 'England',
        ];
        
        return $countryMap[$league] ?? 'Unknown';
    }
    
    /**
     * Get all matches with related data
     */
    public function index()
    {
        $matches = MatchModel::with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])
            ->orderBy('match_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $matches
        ]);
    }
    
    /**
     * Get match by ID
     */
    public function show($id)
    {
        $match = MatchModel::with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])->find($id);
        
        if (!$match) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $match
        ]);
    }
    
    /**
     * Get matches ready for Python processing
     */
    public function getMatchesForML()
    {
        $matches = MatchModel::with(['homeTeam', 'awayTeam', 'teamForms', 'headToHead'])
            ->where('for_ml_training', true)
            ->where('prediction_ready', false)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($match) {
                return [
                    'match_id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'league' => $match->league,
                    'match_date' => $match->match_date,
                    'home_team_form' => $match->teamForms->where('venue', 'home')->first()?->toArray() ?? [],
                    'away_team_form' => $match->teamForms->where('venue', 'away')->first()?->toArray() ?? [],
                    'head_to_head' => $match->headToHead?->toArray() ?? [],
                    'odds' => $match->odds,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $matches
        ]);
    }
    
    /**
     * Update match prediction results from Python
     */
    public function updatePrediction(Request $request, $id)
    {
        $match = MatchModel::find($id);
        
        if (!$match) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'prediction' => 'required|array',
            'generated_slips' => 'nullable|array',
            'confidence' => 'nullable|numeric|min:0|max:1',
            'ml_model_used' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $match->update([
            'prediction' => $request->prediction,
            'generated_slips' => $request->generated_slips ?? [],
            'prediction_confidence' => $request->confidence ?? 0,
            'ml_model_used' => $request->ml_model_used,
            'prediction_ready' => true,
            'prediction_updated_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Prediction updated successfully',
            'data' => $match
        ]);
    }
    
    /**
     * Search teams
     */
    public function searchTeams(Request $request)
    {
        $query = $request->get('q');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }
        
        $teams = Team::where('name', 'like', "%{$query}%")
            ->orWhere('code', 'like', "%{$query}%")
            ->limit(10)
            ->get();
        
        return response()->json($teams);
    }
}