<?php

// app/Http/Controllers/Api/MasterSlipController.php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateAlternativeSlipsJob;
use App\Models\MasterSlip;
use App\Models\MasterSlipSelection;
use Illuminate\Http\JsonResponse;


class MasterSlipController extends Controller
{
    public function store(Request $request)

    {

        $request->validate([
            'stake' => 'numeric|min:1',
            'matches' => 'required|array|min:1',
            'matches.*.match_id' => 'required|exists:matches,id',
            'matches.*.markets' => 'required|array|min:1',
            'matches.*.markets.*.type' => 'required|string',
            'matches.*.markets.*.selection' => 'required|string',
            'matches.*.markets.*.odds' => 'required|numeric|min:1.01',
        ]);

        DB::beginTransaction();
        try {
            $masterSlip = MasterSlip::create([
                'stake' => $request->stake ?? 100,
                'raw_payload' => $request->all(),
                'status' => 'pending',
            ]);

            foreach ($request->matches as $matchItem) {
                MasterSlipSelection::create([
                    'master_slip_id' => $masterSlip->id,
                    'match_id' => $matchItem['match_id'],
                    'markets' => $matchItem['markets'],
                ]);
            }

            // Dispatch job
            GenerateAlternativeSlipsJob::dispatch($masterSlip->id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Master Slip submitted. Generating alternatives...',
                'master_slip_id' => $masterSlip->id,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Master Slip creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit Master Slip',
            ], 500);
        }
    }
}
