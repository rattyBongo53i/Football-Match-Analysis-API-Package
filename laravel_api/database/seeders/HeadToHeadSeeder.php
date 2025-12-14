<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MatchModel;
use App\Models\Head_To_Head;

class HeadToHeadSeeder extends Seeder
{
    public function run(): void
    {
        $matches = MatchModel::all();

        foreach ($matches as $match) {

            // Random structured stats for variety
            $homeWins = rand(0, 5);
            $awayWins = rand(0, 5);
            $draws = rand(0, 3);
            $total = $homeWins + $awayWins + $draws;

            // Build form string: "2-1-2"
            $formString = "{$homeWins}-{$draws}-{$awayWins}";

            // Generate last meetings data
            $lastMeetings = [
                [
                    'date' => now()->subDays(30)->format('Y-m-d'),
                    'result' => ['home', 'away', 'draw'][rand(0, 2)],
                    'score' => rand(1, 3) . '-' . rand(0, 2)
                ],
                [
                    'date' => now()->subDays(90)->format('Y-m-d'),
                    'result' => ['home', 'away', 'draw'][rand(0, 2)],
                    'score' => rand(0, 3) . '-' . rand(0, 3)
                ],
                [
                    'date' => now()->subDays(150)->format('Y-m-d'),
                    'result' => ['home', 'away', 'draw'][rand(0, 2)],
                    'score' => rand(0, 4) . '-' . rand(0, 4)
                ],
                [
                    'date' => now()->subDays(210)->format('Y-m-d'),
                    'result' => ['home', 'away', 'draw'][rand(0, 2)],
                    'score' => rand(1, 3) . '-' . rand(1, 3)
                ],
                [
                    'date' => now()->subDays(270)->format('Y-m-d'),
                    'result' => ['home', 'away', 'draw'][rand(0, 2)],
                    'score' => rand(0, 4) . '-' . rand(0, 4)
                ],
            ];

            // Stats JSON
            $stats = [
                'home_win_percentage' => $total > 0 ? round(($homeWins / $total) * 100, 2) : 0,
                'away_win_percentage' => $total > 0 ? round(($awayWins / $total) * 100, 2) : 0,
                'draw_percentage' => $total > 0 ? round(($draws / $total) * 100, 2) : 0,

                'avg_home_goals' => rand(1, 3) + (rand(0, 9) / 10),
                'avg_away_goals' => rand(0, 2) + (rand(0, 9) / 10),

                'both_teams_scored_percentage' => rand(30, 80),
                'over_2_5_percentage' => rand(30, 70),
            ];

            Head_To_Head::create([
                'match_id' => $match->id,

                'form' => $formString,
                'stats' => $stats,
                'last_meetings' => $lastMeetings,

                'home_wins' => $homeWins,
                'away_wins' => $awayWins,
                'draws' => $draws,
                'total_meetings' => $total,

                'last_meeting_date' => $lastMeetings[0]['date'],
                'last_meeting_result' => $lastMeetings[0]['result'],

                'home_goals' => rand(0, 15),
                'away_goals' => rand(0, 15),

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
