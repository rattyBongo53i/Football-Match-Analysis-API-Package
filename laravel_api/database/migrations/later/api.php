// routes/api.php
Route::get('/matches/{match}/head-to-head', function (Match $match) {
$headToHead = $match->headToHead;

if (!$headToHead) {
return response()->json(['error' => 'Head-to-head data not found'], 404);
}

return response()->json([
'form' => $headToHead->form, // "2-1-2" format
'form_array' => $headToHead->form_array, // [2, 1, 2]
'home_wins' => $headToHead->home_wins,
'away_wins' => $headToHead->away_wins,
'draws' => $headToHead->draws,
'total_meetings' => $headToHead->total_meetings,
'percentages' => [
'home' => $headToHead->home_win_percentage,
'draw' => $headToHead->draw_percentage,
'away' => $headToHead->away_win_percentage,
],
'last_meeting' => $headToHead->last_meeting,
'goals' => [
'home' => $headToHead->home_goals,
'away' => $headToHead->away_goals,
],
'stats' => $headToHead->stats,
'last_meetings' => $headToHead->last_meetings,
'is_home_dominant' => $headToHead->is_home_dominant,
'is_away_dominant' => $headToHead->is_away_dominant,
]);
});


///-
// routes/api.php
Route::apiResource('head-to-head', HeadToHeadController::class)->only(['show', 'update']);
Route::get('matches/{match}/head-to-head', [HeadToHeadController::class, 'show']);