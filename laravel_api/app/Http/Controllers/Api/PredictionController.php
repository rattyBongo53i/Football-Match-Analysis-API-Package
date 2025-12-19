<?php
// app/Http/Controllers/Api/PredictionController.php





/**
 * **
 * POST endpoint creates master slip for match, generates 50 stub alternative slips with random odds from match markets,
 *  marks match completed.
 *  GET endpoint returns all alternative slips grouped under master slip for the match.
 *  Minimal tables/models added for slips. Uses existing match markets for stub selections. No jobs or external calls.
 * 
 * 
 * 
 */
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use App\Models\MasterSlip;
use Illuminate\Http\JsonResponse;

class PredictionController extends Controller
{
    public function getByMatch(string $matchId): JsonResponse
    {
        $match = MatchModel::find($matchId);

        if (!$match) {
            return response()->json(['success' => false, 'message' => 'Match not found'], 404);
        }

        $masterSlip = MasterSlip::where('match_id', $matchId)->firstOrFail();

        $slips = $masterSlip->slips->map(function ($slip) use ($masterSlip) {
            return [
                'id' => $slip->id,
                'stake' => $masterSlip->stake,
                'total_odds' => $slip->total_odds,
                'potential_return' => $slip->potential_return,
                'selections' => $slip->selections,
            ];
        });

        return response()->json([
            'match_id' => (int) $matchId,
            'master_slip_id' => $masterSlip->id,
            'slips' => $slips,
        ]);
    }
}