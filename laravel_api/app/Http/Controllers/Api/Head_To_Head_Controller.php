<?php

// namespace App\Http\Controllers\API;

// use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;

// // app/Http/Controllers/API/HeadToHeadController.php
// <?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Match;
use App\Models\HeadToHead;
use App\Models\MatchModel;
use Illuminate\Http\Request;
use App\Models\Head_To_Head;

class Head_To_Head_Controller extends Controller
{
    /**
     * Get head-to-head data for a match
     */
    public function show($matchId)
    {
        $match = MatchModel::findOrFail($matchId);
        $headToHead = $match->headToHead;
        
        if (!$headToHead) {
            return response()->json([
                'message' => 'Head-to-head data not found for this match',
                'match_id' => $matchId,
                'teams' => $match->home_team . ' vs ' . $match->away_team,
            ], 404);
        }
        
        return response()->json([
            'match_id' => $matchId,
            'teams' => [
                'home' => $match->home_team,
                'away' => $match->away_team,
            ],
            'form' => $headToHead->form,
            'form_readable' => $headToHead->form_readable,
            'form_array' => $headToHead->form_array,
            'stats' => [
                'home_wins' => $headToHead->home_wins,
                'away_wins' => $headToHead->away_wins,
                'draws' => $headToHead->draws,
                'total_meetings' => $headToHead->total_meetings,
                'home_win_percentage' => round($headToHead->home_win_percentage, 2),
                'away_win_percentage' => round($headToHead->away_win_percentage, 2),
                'draw_percentage' => round($headToHead->draw_percentage, 2),
            ],
            'goals' => [
                'home' => $headToHead->home_goals,
                'away' => $headToHead->away_goals,
                'total' => $headToHead->home_goals + $headToHead->away_goals,
                'average_home' => $headToHead->total_meetings > 0 ? 
                    round($headToHead->home_goals / $headToHead->total_meetings, 2) : 0,
                'average_away' => $headToHead->total_meetings > 0 ? 
                    round($headToHead->away_goals / $headToHead->total_meetings, 2) : 0,
            ],
            'last_meeting' => $headToHead->last_meeting,
            'last_meetings' => $headToHead->last_meetings,
            'analysis' => [
                'is_home_dominant' => $headToHead->is_home_dominant,
                'is_away_dominant' => $headToHead->is_away_dominant,
                'dominant_team' => $headToHead->is_home_dominant ? 'home' : 
                                 ($headToHead->is_away_dominant ? 'away' : 'none'),
                'strength_difference' => abs($headToHead->home_wins - $headToHead->away_wins),
            ],
            'detailed_stats' => $headToHead->stats,
            'created_at' => $headToHead->created_at,
            'updated_at' => $headToHead->updated_at,
        ]);
    }
    
    /**
     * Update head-to-head data for a match
     */
    public function update(Request $request, $matchId)
    {
        $match = MatchModel::findOrFail($matchId);
        
        $validated = $request->validate([
            'form' => 'sometimes|string|regex:/^\d+-\d+-\d+$/',
            'home_wins' => 'sometimes|integer|min:0',
            'away_wins' => 'sometimes|integer|min:0',
            'draws' => 'sometimes|integer|min:0',
            'last_meeting_date' => 'sometimes|date',
            'last_meeting_result' => 'sometimes|in:home,draw,away',
            'stats' => 'sometimes|array',
            'last_meetings' => 'sometimes|array',
        ]);
        
        $headToHead = $match->headToHead ?? new Head_To_Head(['match_id' => $matchId]);
        
        $headToHead->fill($validated);
        $headToHead->save();
        
        return response()->json([
            'message' => 'Head-to-head data updated successfully',
            'data' => $headToHead,
        ]);
    }
}