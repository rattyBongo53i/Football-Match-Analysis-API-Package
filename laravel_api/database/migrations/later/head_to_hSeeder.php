<?php
// In your DatabaseSeeder or HeadToHeadSeeder
public function run()
{
$matches = Match::all();

foreach ($matches as $match) {
HeadToHead::create([
'match_id' => $match->id,
'form' => rand(0, 5) . '-' . rand(0, 3) . '-' . rand(0, 5), // e.g., "2-1-2"
'home_wins' => rand(0, 5),
'away_wins' => rand(0, 5),
'draws' => rand(0, 3),
'total_meetings' => rand(3, 20),
'last_meeting_date' => now()->subDays(rand(30, 365))->format('Y-m-d'),
'last_meeting_result' => ['home', 'draw', 'away'][rand(0, 2)],
'home_goals' => rand(0, 20),
'away_goals' => rand(0, 20),
'stats' => [
'home_win_percentage' => rand(20, 80),
'away_win_percentage' => rand(20, 80),
'draw_percentage' => rand(10, 40),
'avg_home_goals' => rand(1, 3) + (rand(0, 9) / 10),
'avg_away_goals' => rand(0, 2) + (rand(0, 9) / 10),
'both_teams_scored_percentage' => rand(30, 80),
'over_2_5_percentage' => rand(30, 70),
],
'last_meetings' => [
['date' => now()->subDays(30)->format('Y-m-d'), 'result' => 'home', 'score' => '2-1'],
['date' => now()->subDays(90)->format('Y-m-d'), 'result' => 'draw', 'score' => '1-1'],
['date' => now()->subDays(150)->format('Y-m-d'), 'result' => 'away', 'score' => '0-2'],
['date' => now()->subDays(210)->format('Y-m-d'), 'result' => 'home', 'score' => '3-0'],
['date' => now()->subDays(270)->format('Y-m-d'), 'result' => 'draw', 'score' => '2-2'],
],
]);
}
}