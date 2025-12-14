<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TeamFormSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            // =======================
            // 1. BARCELONA EXAMPLE
            // =======================
            [
                "match_id" => 551,
                "team_id" => "FCB",
                "venue" => "home",

                "raw_form" => json_encode([
                    [
                        "opponent" => "Sevilla",
                        "result" => "2-1",
                        "outcome" => "W",
                        "opponent_rank" => 8
                    ],
                    [
                        "opponent" => "Valencia",
                        "result" => "1-1",
                        "outcome" => "D",
                        "opponent_rank" => 12
                    ]
                ]),

                "matches_played" => 10,
                "wins" => 6,
                "draws" => 3,
                "losses" => 1,

                "goals_scored" => 18,
                "goals_conceded" => 9,
                "avg_goals_scored" => 1.8,
                "avg_goals_conceded" => 0.9,

                "form_rating" => 7.8,
                "form_momentum" => 0.35,

                "clean_sheets" => 4,
                "failed_to_score" => 1,
                "form_string" => "WWDLWDWLWW",

                "opponent_strength" => json_encode([
                    "avg_opponent_rank" => 9.7,
                    "strong_opponents" => 3,
                    "weak_opponents" => 4
                ]),

                "win_probability" => 0.61,
                "draw_probability" => 0.22,
                "loss_probability" => 0.17,

                "created_at" => now(),
                "updated_at" => now(),
            ],

            // =======================
            // 2. MAN CITY EXAMPLE
            // =======================
            [
                "match_id" => 506,
                "team_id" => "MCI",
                "venue" => "home",

                "raw_form" => json_encode([
                    ["opponent" => "Chelsea", "result" => "2-0", "outcome" => "W", "opponent_rank" => 10],
                    ["opponent" => "Liverpool", "result" => "1-1", "outcome" => "D", "opponent_rank" => 3],
                    ["opponent" => "Spurs", "result" => "3-2", "outcome" => "W", "opponent_rank" => 7],
                    ["opponent" => "Arsenal", "result" => "0-1", "outcome" => "L", "opponent_rank" => 1]
                ]),

                "matches_played" => 10,
                "wins" => 7,
                "draws" => 2,
                "losses" => 1,
                "goals_scored" => 21,
                "goals_conceded" => 9,
                "avg_goals_scored" => 2.1,
                "avg_goals_conceded" => 0.9,

                "clean_sheets" => 3,
                "failed_to_score" => 0,
                "form_string" => "WWDLWWLWWW",
                "form_rating" => 8.3,
                "form_momentum" => 0.45,

                "opponent_strength" => json_encode([
                    "avg_opponent_rank" => 6.4,
                    "strong_opponents" => 4,
                    "weak_opponents" => 3
                ]),

                "win_probability" => 0.64,
                "draw_probability" => 0.19,
                "loss_probability" => 0.17,

                "created_at" => now(),
                "updated_at" => now(),
            ],

            // =======================
            // 3. BRIGHTON EXAMPLE
            // =======================
            [
                "match_id" => 506,
                "team_id" => "BHA",
                "venue" => "away",

                "raw_form" => json_encode([
                    ["opponent" => "Bournemouth", "result" => "1-2", "outcome" => "L", "opponent_rank" => 14],
                    ["opponent" => "Brentford", "result" => "3-3", "outcome" => "D", "opponent_rank" => 16]
                ]),

                "matches_played" => 10,
                "wins" => 3,
                "draws" => 4,
                "losses" => 3,
                "goals_scored" => 13,
                "goals_conceded" => 15,
                "avg_goals_scored" => 1.3,
                "avg_goals_conceded" => 1.5,

                "clean_sheets" => 1,
                "failed_to_score" => 2,
                "form_string" => "LDWDLLDWLW",

                "form_rating" => 5.2,
                "form_momentum" => -0.12,

                "opponent_strength" => json_encode([
                    "avg_opponent_rank" => 11.8,
                    "strong_opponents" => 2,
                    "weak_opponents" => 4
                ]),

                "win_probability" => 0.28,
                "draw_probability" => 0.31,
                "loss_probability" => 0.41,

                "created_at" => now(),
                "updated_at" => now(),
            ]
        ];

        DB::table('team_forms')->insert($data);
    }
}
