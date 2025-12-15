<?php

use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TeamFormController as ApiTeamFormController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\TeamFormController;
use App\Http\Controllers\Api\Head_To_Head_Controller;
use App\Http\Controllers\Api\SlipController;
use App\Http\Controllers\Api\GeneratorController;
use App\Http\Controllers\Api\MarketController;
// use App\Http\Controllers\HealthController; // Or inline if simple


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//health returns ok
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});
//return api is working
Route::get('/test', function (Request $request) {
    return response()->json(['message' => 'API is working'], 200);
});

// Polygot

// match
Route::prefix('matches')->group(function () {
    Route::get('/', [MatchController::class, 'index']);
    Route::post('/', [MatchController::class, 'store']);
    Route::get('/{id}', [MatchController::class, 'show']);
    Route::put('/{id}', [MatchController::class, 'update']);
    Route::delete('/{id}', [MatchController::class, 'destroy']);
    Route::get('/for-ml', [MatchController::class, 'getMatchesForML']);
    Route::post('/{id}/prediction', [MatchController::class, 'updatePrediction']);
    Route::get('/search', [MatchController::class, 'searchTeams']);
    // tdb
    Route::get('/{id}/stats', [MatchController::class, 'stats']);
    });

// team
Route::prefix('teams')->group(function () {
    Route::get('/', [TeamController::class, 'index']);
    Route::post('/', [TeamController::class, 'store']);
    Route::post('/bulk-import', [TeamController::class, 'bulkImport']);
    Route::get('/search', [TeamController::class, 'search']);
    Route::get('/best-form', [TeamController::class, 'bestForm']);
    Route::get('/{code}', [TeamController::class, 'show']);
    Route::put('/{code}', [TeamController::class, 'update']);
    Route::get('/{code}/stats', [TeamController::class, 'getStats']);
    Route::post('/{code}/update-stats', [TeamController::class, 'updateMatchStats']);
    // No delete? Add if needed: Route::delete('/{code}', [TeamController::class, 'destroy']);
});

    // Team Focrms (RESTful)
Route::apiResource('team-forms', TeamFormController::class)->except(['show', 'destroy']); // No show/destroy in frontend
Route::post('team-forms/calculate', [TeamFormController::class, 'calculate']);




/********************************************************************************************************************* *

 API update
 Frontend calls POST /api/generator with master slip and options

Laravel creates GeneratorJob record and dispatches ProcessPythonRequest

Python service processes and calls POST /api/generator/webhook/{jobId}

Laravel updates job status and creates generated slips

Frontend polls GET /api/generator/status/{jobId} for updates

/********************************************************************************************************************* */


Route::post('generator/{jobId}/webhook', [GeneratorController::class, 'updateJobStatus']);
Route::post('generator/webhook/{jobId}', [GeneratorController::class, 'webhook'])
    ->name('api.generator.webhook');


// Health check (simple, no controller needed if basic)
Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});

// // Root test endpoint
// Route::get('/', function () {
//     return response()->json(['message' => 'API is running']);
// });

// Matches (RESTful + customs)

// Teams (RESTful, but using {code} instead of {id})


// Head-to-Head
Route::group(['prefix' => 'head-to-head'], function () {
    Route::post('/', [Head_To_Head_Controller::class, 'store']);
    Route::get('/{matchId}', [Head_To_Head_Controller::class, 'show']);
    Route::put('/{matchId}', [Head_To_Head_Controller::class, 'update']);
    Route::get('/calculate', [Head_To_Head_Controller::class, 'calculate']); // home_team, away_team params
});

// Slips (RESTful + customs)
Route::apiResource('slips', SlipController::class);
Route::post('slips/master', [SlipController::class, 'createMaster']);
Route::post('slips/{slipId}/matches', [SlipController::class, 'addMatch']);

// Generator
Route::post('generator', [GeneratorController::class, 'generate']);
Route::get('generator/status/{jobId}', [GeneratorController::class, 'status']);
Route::get('generator/jobs', [GeneratorController::class, 'listJobs']);
Route::post('generator/{jobId}/cancel', [GeneratorController::class, 'cancel']);

// Markets (RESTful)
Route::apiResource('markets', MarketController::class);
Route::get('markets/{marketId}/outcomes', [MarketController::class, 'outcomes']);

// Predictions (if implemented, add resource)
// Route::apiResource('predictions', PredictionController::class);

// Add auth middleware if needed, e.g.:
// Route::middleware('auth:sanctum')->group(function () { ... });