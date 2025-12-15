<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Support\Str;

class TeamService
{
    /**
     * Resolve a team by name, creating if doesn't exist.
     */
    public function resolveTeam(string $name, string $league): Team
    {
        $team = Team::where('name', trim($name))->first();

        if (!$team) {
            $team = Team::create([
                'name' => trim($name),
                'code' => $this->generateTeamCode($name),
                'slug' => Str::slug($name),
                'country' => $this->extractCountryFromLeague($league),
                'overall_rating' => 5.0,
                'attack_rating' => 5.0,
                'defense_rating' => 5.0,
                'home_strength' => 5.0,
                'away_strength' => 5.0,
                'matches_played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_scored' => 0,
                'goals_conceded' => 0,
                'goal_difference' => 0,
                'points' => 0,
            ]);
        }

        return $team;
    }

    /**
     * Generate a team code from name.
     */
    private function generateTeamCode(string $name): string
    {
        $cleanName = preg_replace('/\s+/', '', $name);
        return strtoupper(substr($cleanName, 0, 3));
    }

    /**
     * Extract country from league name.
     */
    public function extractCountryFromLeague(string $league): string
    {
        $countryMap = [
            'Premier League' => 'England',
            'La Liga' => 'Spain',
            'Serie A' => 'Italy',
            'Bundesliga' => 'Germany',
            'Ligue 1' => 'France',
            'Eredivisie' => 'Netherlands',
            'Primeira Liga' => 'Portugal',
            'Scottish Premiership' => 'Scotland',
            'MLS' => 'USA',
            'A-League' => 'Australia',
        ];

        return $countryMap[$league] ?? 'Unknown';
    }
}