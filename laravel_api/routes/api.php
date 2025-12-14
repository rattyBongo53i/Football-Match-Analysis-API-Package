<?php

use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\TeamController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
    Route::get('/search/teams', [MatchController::class, 'searchTeams']);
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
});