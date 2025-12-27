<?php
// app/Services/HeadToHeadService.php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Team;
use App\Models\Head_To_Head;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class HeadToHeadService
{
    const H2H_CACHE_TTL = 3600; // 1 hour
    const MAX_H2H_MATCHES = 20;
    
    /**
     * Get comprehensive head-to-head data
     */
    public function getHeadToHeadData(int $team1Id, int $team2Id, int $limit = 5): array
    {
        $cacheKey = "h2h_{$team1Id}_{$team2Id}_{$limit}";

        return Cache::remember($cacheKey, self::H2H_CACHE_TTL, function () use ($team1Id, $team2Id, $limit) {
            $team1 = Team::find($team1Id);
            $team2 = Team::find($team2Id);

            if (!$team1 || !$team2) {
                Log::warning('Teams not found for H2H lookup', [
                    'team1_id' => $team1Id,
                    'team2_id' => $team2Id
                ]);

                return $this->getNeutralH2HData($team1, $team2);
            }

            // Get authoritative head-to-head record from head_to_head table
            $h2hRecord = $this->getHistoricalMatches($team1Id, $team2Id);

            if (!$h2hRecord) {
                Log::info('No head-to-head record found', [
                    'team1' => $team1->name,
                    'team2' => $team2->name
                ]);

                return $this->getNeutralH2HData($team1, $team2);
            }

            // Calculate statistics from the precomputed record
            $stats = $this->calculateH2HStats($h2hRecord, $team1Id, $team2Id);

            // Use recent meetings from JSON (already limited in the data)
            $lastMeetings = json_decode($h2hRecord->last_meetings, true) ?? [];
            $recentMeetings = array_slice($lastMeetings, 0, $limit);

            // Determine dominance from precomputed score
            $dominance = $this->determineDominance($stats, $team1, $team2);

            // Get venue performance (simplified - use home/away goals from record)
            $venuePerformance = $this->getVenuePerformance($h2hRecord, $team1Id, $team2Id);

            // Get recent trend from last meetings
            $recentTrend = $this->getRecentTrend($recentMeetings, $team1Id, $team2Id, $h2hRecord);

            return [
                'team1' => [
                    'id' => $team1->id,
                    'name' => $team1->name,
                ],
                'team2' => [
                    'id' => $team2->id,
                    'name' => $team2->name,
                ],
                'total_matches' => $stats['total_matches'],
                'team1_wins' => $stats['team1_wins'],
                'team2_wins' => $stats['team2_wins'],
                'draws' => $stats['draws'],
                'team1_win_rate' => $stats['team1_win_rate'],
                'team2_win_rate' => $stats['team2_win_rate'],
                'draw_rate' => $stats['draw_rate'],
                'avg_goals' => $stats['avg_goals'],
                'avg_goals_team1' => $stats['avg_goals_team1'],
                'avg_goals_team2' => $stats['avg_goals_team2'],
                'dominance' => $dominance,
                'venue_performance' => $venuePerformance,
                'recent_trend' => $recentTrend,
                'last_meetings' => $this->formatRecentMeetings($h2hRecord, $team1Id, $team2Id),
                'historical_summary' => $this->getHistoricalSummary($h2hRecord, $team1Id, $team2Id),
            ];
        });
    }

    protected function getNeutralH2HData($team1, $team2): array
{
    return [
        'team1' => $team1 ? ['id' => $team1->id, 'name' => $team1->name] : null,
        'team2' => $team2 ? ['id' => $team2->id, 'name' => $team2->name] : null,
        'total_matches' => 0,
        'team1_wins' => 0,
        'team2_wins' => 0,
        'draws' => 0,
        'team1_win_rate' => 0,
        'team2_win_rate' => 0,
        'draw_rate' => 0,
        'avg_goals' => 0,
        'avg_goals_team1' => 0,
        'avg_goals_team2' => 0,
        'dominance' => ['dominant_team' => null, 'dominance_level' => 'none'],
        'venue_performance' => ['home_advantage' => 0],
        'recent_trend' => ['last_5_results' => [], 'momentum' => 'neutral'],
        'last_meetings' => [],
        'historical_summary' => [],
    ];
}
    
    /**
     * Get historical matches between teams
     */
    protected function getHistoricalMatches(int $team1Id, int $team2Id)
    {
        // Query head_to_head table directly - primary source of truth
        return Head_To_Head::where(function ($query) use ($team1Id, $team2Id) {
            $query->where(function ($q) use ($team1Id, $team2Id) {
                $q->where('home_id', $team1Id)
                    ->where('away_id', $team2Id);
            })->orWhere(function ($q) use ($team1Id, $team2Id) {
                $q->where('home_id', $team2Id)
                    ->where('away_id', $team1Id);
            });
        })->first();
    }
    
    /**
     * Calculate H2H statistics
     */
    protected function calculateH2HStats($h2hRecord, int $team1Id, int $team2Id): array
    {
        if (!$h2hRecord) {
            return [
                'total_matches' => 0,
                'team1_wins' => 0,
                'team2_wins' => 0,
                'draws' => 0,
                'team1_win_rate' => 0,
                'team2_win_rate' => 0,
                'draw_rate' => 0,
                'avg_goals' => 0,
                'avg_goals_team1' => 0,
                'avg_goals_team2' => 0,
                'total_goals_team1' => 0,
                'total_goals_team2' => 0,
            ];
        }

        // Decode stats JSON
        $stats = json_decode($h2hRecord->stats, true) ?? [];

        // Determine if team1 is home or away in this record
        $isTeam1Home = $h2hRecord->home_id == $team1Id;

        // Map stats based on which team is which
        $team1Wins = $isTeam1Home ? ($stats['home_wins'] ?? 0) : ($stats['away_wins'] ?? 0);
        $team2Wins = $isTeam1Home ? ($stats['away_wins'] ?? 0) : ($stats['home_wins'] ?? 0);
        $draws = $stats['draws'] ?? 0;
        $totalMatches = $stats['total_meetings'] ?? 0;

        // Goals from the record (already aggregated)
        $totalGoalsTeam1 = $isTeam1Home ? ($h2hRecord->home_goals ?? 0) : ($h2hRecord->away_goals ?? 0);
        $totalGoalsTeam2 = $isTeam1Home ? ($h2hRecord->away_goals ?? 0) : ($h2hRecord->home_goals ?? 0);

        // Calculate averages
        $avgGoals = $totalMatches > 0 ? round(($totalGoalsTeam1 + $totalGoalsTeam2) / $totalMatches, 2) : 0;
        $avgGoalsTeam1 = $totalMatches > 0 ? round($totalGoalsTeam1 / $totalMatches, 2) : 0;
        $avgGoalsTeam2 = $totalMatches > 0 ? round($totalGoalsTeam2 / $totalMatches, 2) : 0;

        return [
            'total_matches' => $totalMatches,
            'team1_wins' => $team1Wins,
            'team2_wins' => $team2Wins,
            'draws' => $draws,
            'team1_win_rate' => $totalMatches > 0 ? round($team1Wins / $totalMatches, 3) : 0,
            'team2_win_rate' => $totalMatches > 0 ? round($team2Wins / $totalMatches, 3) : 0,
            'draw_rate' => $totalMatches > 0 ? round($draws / $totalMatches, 3) : 0,
            'avg_goals' => $avgGoals,
            'avg_goals_team1' => $avgGoalsTeam1,
            'avg_goals_team2' => $avgGoalsTeam2,
            'total_goals_team1' => $totalGoalsTeam1,
            'total_goals_team2' => $totalGoalsTeam2,
        ];
    }
    
    /**
     * Determine which team dominates the matchup
     */
    protected function determineDominance(array $stats, $team1, $team2): array
    {
        $dominanceScore = $stats['team1_wins'] - $stats['team2_wins'];
        $goalDifference = $stats['total_goals_team1'] - $stats['total_goals_team2'];
        
        if ($stats['total_matches'] == 0) {
            return [
                'dominant_team' => null,
                'dominance_level' => 'none',
                'dominance_score' => 0,
                'explanation' => 'No historical matches',
            ];
        }
        
        if ($dominanceScore > 2) {
            $dominantTeam = $team1;
            $level = 'strong';
        } elseif ($dominanceScore > 0) {
            $dominantTeam = $team1;
            $level = 'moderate';
        } elseif ($dominanceScore < -2) {
            $dominantTeam = $team2;
            $level = 'strong';
        } elseif ($dominanceScore < 0) {
            $dominantTeam = $team2;
            $level = 'moderate';
        } else {
            $dominantTeam = null;
            $level = 'balanced';
        }
        
        return [
            'dominant_team' => $dominantTeam ? $dominantTeam->name : null,
            'dominance_level' => $level,
            'dominance_score' => $dominanceScore,
            'goal_difference' => $goalDifference,
            'explanation' => $this->generateDominanceExplanation($stats, $dominantTeam, $level),
        ];
    }
    
    /**
     * Generate dominance explanation
     */
    protected function generateDominanceExplanation(array $stats, $dominantTeam, string $level): string
    {
        if (!$dominantTeam) {
            return 'Teams have a balanced history with equal wins';
        }
        
        $teamName = $dominantTeam->name ?? $dominantTeam;
        $wins = $teamName == ($stats['team1_name'] ?? 'Team 1') ? $stats['team1_wins'] : $stats['team2_wins'];
        $oppWins = $teamName == ($stats['team1_name'] ?? 'Team 1') ? $stats['team2_wins'] : $stats['team1_wins'];
        
        return sprintf(
            '%s has a %s historical advantage with %d wins vs %d wins over %d total matches',
            $teamName,
            $level,
            $wins,
            $oppWins,
            $stats['total_matches']
        );
    }
    
    /**
     * Get venue performance breakdown
     */
    protected function getVenuePerformance($matches, int $team1Id, int $team2Id): array
    {
        $homeStats = ['wins' => 0, 'draws' => 0, 'losses' => 0, 'goals_for' => 0, 'goals_against' => 0];
        $awayStats = ['wins' => 0, 'draws' => 0, 'losses' => 0, 'goals_for' => 0, 'goals_against' => 0];
        
        foreach ($matches as $match) {
            $isTeam1Home = $match->home_team_id == $team1Id;
            $team1Goals = $isTeam1Home ? $match->home_goals : $match->away_goals;
            $team2Goals = $isTeam1Home ? $match->away_goals : $match->home_goals;
            
            if ($isTeam1Home) {
                $stats = &$homeStats;
            } else {
                $stats = &$awayStats;
            }
            
            $stats['goals_for'] += $team1Goals;
            $stats['goals_against'] += $team2Goals;
            
            if ($team1Goals > $team2Goals) {
                $stats['wins']++;
            } elseif ($team1Goals < $team2Goals) {
                $stats['losses']++;
            } else {
                $stats['draws']++;
            }
        }
        
        return [
            'team1_home' => $homeStats,
            'team1_away' => $awayStats,
            'home_advantage' => $this->calculateHomeAdvantage($homeStats, $awayStats),
        ];
    }
    
    /**
     * Calculate home advantage
     */
    protected function calculateHomeAdvantage(array $homeStats, array $awayStats): float
    {
        $homeTotal = $homeStats['wins'] + $homeStats['draws'] + $homeStats['losses'];
        $awayTotal = $awayStats['wins'] + $awayStats['draws'] + $awayStats['losses'];
        
        if ($homeTotal == 0 || $awayTotal == 0) {
            return 0.0;
        }
        
        $homeWinRate = $homeStats['wins'] / $homeTotal;
        $awayWinRate = $awayStats['wins'] / $awayTotal;
        
        return round($homeWinRate - $awayWinRate, 3);
    }
    
    /**
     * Get recent trend
     */
    protected function getRecentTrend($recentMatches, int $team1Id, int $team2Id): array
    {
        $trend = [];
        $team1Wins = 0;
        $team2Wins = 0;
        $draws = 0;
        
        foreach ($recentMatches as $match) {
            $isTeam1Home = $match->home_team_id == $team1Id;
            $team1Goals = $isTeam1Home ? $match->home_goals : $match->away_goals;
            $team2Goals = $isTeam1Home ? $match->away_goals : $match->home_goals;
            
            if ($team1Goals > $team2Goals) {
                $trend[] = 'team1';
                $team1Wins++;
            } elseif ($team1Goals < $team2Goals) {
                $trend[] = 'team2';
                $team2Wins++;
            } else {
                $trend[] = 'draw';
                $draws++;
            }
        }
        
        $totalRecent = count($recentMatches);
        
        return [
            'last_5_results' => $trend,
            'team1_wins_last_5' => $team1Wins,
            'team2_wins_last_5' => $team2Wins,
            'draws_last_5' => $draws,
            'trend_direction' => $this->getTrendDirection($trend),
            'momentum' => $this->getRecentMomentum($trend),
        ];
    }
    
    /**
     * Get trend direction
     */
    protected function getTrendDirection(array $trend): string
    {
        if (empty($trend)) {
            return 'none';
        }
        
        $first = $trend[0];
        $last = $trend[count($trend) - 1];
        
        if ($first == $last) {
            return 'stable';
        }
        
        $strength = [
            'team1' => 2,
            'draw' => 1,
            'team2' => 0,
        ];
        
        return $strength[$last] > $strength[$first] ? 'improving' : 'declining';
    }
    
    /**
     * Get recent momentum
     */
    protected function getRecentMomentum(array $trend): string
    {
        if (count($trend) < 3) {
            return 'neutral';
        }
        
        $lastThree = array_slice($trend, 0, 3);
        $team1Count = array_count_values($lastThree)['team1'] ?? 0;
        $team2Count = array_count_values($lastThree)['team2'] ?? 0;
        
        if ($team1Count >= 2) return 'team1';
        if ($team2Count >= 2) return 'team2';
        return 'neutral';
    }
    
    /**
     * Format recent meetings
     */
    protected function formatRecentMeetings($h2hRecord, int $team1Id, int $team2Id): array
    {
        if (!$h2hRecord || !$h2hRecord->last_meetings) {
            return [];
        }

        $lastMeetings = json_decode($h2hRecord->last_meetings, true) ?? [];
        $formatted = [];

        foreach ($lastMeetings as $meeting) {
            // Determine if team1 was home in this meeting
            $isTeam1Home = ($meeting['home_team'] ?? '') === ($h2hRecord->home_name ?? '');

            $formatted[] = [
                'date' => $meeting['date'] ?? 'Unknown',
                'home_team' => $meeting['home_team'] ?? 'Unknown',
                'away_team' => $meeting['away_team'] ?? 'Unknown',
                'score' => $meeting['score'] ?? '0-0',
                'venue' => 'Unknown', // Not stored in JSON
                'league' => 'Unknown', // Not stored in JSON
                'winner' => $this->determineWinnerFromResult($meeting['result'] ?? 'D', $meeting['home_team'] ?? '', $meeting['away_team'] ?? ''),
                'team1_goals' => $isTeam1Home ? explode('-', $meeting['score'] ?? '0-0')[0] : explode('-', $meeting['score'] ?? '0-0')[1],
                'team2_goals' => $isTeam1Home ? explode('-', $meeting['score'] ?? '0-0')[1] : explode('-', $meeting['score'] ?? '0-0')[0],
                'team1_was_home' => $isTeam1Home,
            ];
        }

        return $formatted;
    }

    protected function determineWinnerFromResult(string $result, string $homeTeam, string $awayTeam): string
    {
        return match ($result) {
            'H' => $homeTeam,
            'A' => $awayTeam,
            default => 'Draw',
        };
    }
    /**
     * Determine winner for formatted output
     */
    protected function determineWinner($match, int $team1Id, int $team2Id): string
    {
        if ($match->home_goals > $match->away_goals) {
            return $match->homeTeam->name;
        } elseif ($match->home_goals < $match->away_goals) {
            return $match->awayTeam->name;
        }
        return 'Draw';
    }
    
    /**
     * Get historical summary
     */
    protected function getHistoricalSummary($matches, int $team1Id, int $team2Id): array
    {
        $firstMeeting = $matches->last();
        $lastMeeting = $matches->first();
        
        return [
            'first_meeting' => $firstMeeting ? [
                'date' => $firstMeeting->match_date->format('Y-m-d'),
                'score' => $firstMeeting->home_goals . '-' . $firstMeeting->away_goals,
                'venue' => $firstMeeting->venue->name,
            ] : null,
            'last_meeting' => $lastMeeting ? [
                'date' => $lastMeeting->match_date->format('Y-m-d'),
                'score' => $lastMeeting->home_goals . '-' . $lastMeeting->away_goals,
                'venue' => $lastMeeting->venue->name,
                'winner' => $this->determineWinner($lastMeeting, $team1Id, $team2Id),
            ] : null,
            'timespan' => $firstMeeting && $lastMeeting 
                ? $firstMeeting->match_date->diffInYears($lastMeeting->match_date) 
                : 0,
            'biggest_win' => $this->getBiggestWin($matches, $team1Id, $team2Id),
            'highest_scoring' => $this->getHighestScoringMatch($matches),
        ];
    }
    
    /**
     * Get biggest win
     */
    protected function getBiggestWin($matches, int $team1Id, int $team2Id): ?array
    {
        $biggestMargin = 0;
        $biggestWin = null;
        
        foreach ($matches as $match) {
            $isTeam1Home = $match->home_team_id == $team1Id;
            $team1Goals = $isTeam1Home ? $match->home_goals : $match->away_goals;
            $team2Goals = $isTeam1Home ? $match->away_goals : $match->home_goals;
            
            $margin = abs($team1Goals - $team2Goals);
            if ($margin > $biggestMargin) {
                $biggestMargin = $margin;
                $biggestWin = [
                    'date' => $match->match_date->format('Y-m-d'),
                    'score' => $match->home_goals . '-' . $match->away_goals,
                    'winner' => $team1Goals > $team2Goals 
                        ? ($isTeam1Home ? 'team1' : 'team2')
                        : ($isTeam1Home ? 'team2' : 'team1'),
                    'margin' => $margin,
                ];
            }
        }
        
        return $biggestWin;
    }
    
    /**
     * Get highest scoring match
     */
    protected function getHighestScoringMatch($matches): ?array
    {
        $highestTotal = 0;
        $highestMatch = null;
        
        foreach ($matches as $match) {
            $totalGoals = $match->home_goals + $match->away_goals;
            if ($totalGoals > $highestTotal) {
                $highestTotal = $totalGoals;
                $highestMatch = [
                    'date' => $match->match_date->format('Y-m-d'),
                    'score' => $match->home_goals . '-' . $match->away_goals,
                    'total_goals' => $totalGoals,
                    'venue' => $match->venue->name,
                ];
            }
        }
        
        return $highestMatch;
    }
}