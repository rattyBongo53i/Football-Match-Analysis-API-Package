<?php
// app/Jobs/GenerateAlternativeSlipsJob.php

namespace App\Jobs;

use App\Models\MasterSlip;
use App\Models\Match;
use App\Models\Team;
use App\Models\Venue;
use App\Models\League;
use App\Models\Referee;
use App\Models\Market;
use App\Services\TeamFormService;
use App\Services\HeadToHeadService;
use App\Services\MarketDataService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GenerateAlternativeSlipsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 180;
    public $tries = 3;
    public $backoff = [30, 60, 120];
    
    protected $masterSlipId;
    protected $predictionType;
    protected $riskProfile;
    protected $jobId;

    public function __construct($masterSlipId, $predictionType = 'monte_carlo', $riskProfile = 'medium', $jobId = null)
    {
        $this->masterSlipId = $masterSlipId;
        $this->predictionType = $predictionType;
        $this->riskProfile = $riskProfile;
        $this->jobId = $jobId ?? uniqid('altslip_', true);
        
        $this->onQueue('slip_generation');
    }

    public function handle(
        TeamFormService $teamFormService,
        HeadToHeadService $headToHeadService,
        MarketDataService $marketDataService
    ) {
        Log::info('Starting alternative slip generation', [
            'job_id' => $this->jobId,
            'master_slip_id' => $this->masterSlipId,
            'prediction_type' => $this->predictionType,
            'risk_profile' => $this->riskProfile,
        ]);

        try {
            $masterSlip = $this->loadMasterSlipData();
            $payload = $this->preparePythonPayload($masterSlip, $teamFormService, $headToHeadService, $marketDataService);
            
            // Dispatch to ProcessPythonRequest for actual Python engine call
            $this->dispatchToPythonEngine($payload);
            
            // Update master slip status
            $masterSlip->update([
                'status' => 'processing',
                'processing_started_at' => now(),
                'job_id' => $this->jobId,
            ]);
            
            Log::info('Master slip payload prepared and dispatched to Python engine', [
                'job_id' => $this->jobId,
                'master_slip_id' => $this->masterSlipId,
                'match_count' => count($payload['master_slip']['matches']),
                'total_matches' => $payload['master_slip']['total_matches'],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to prepare master slip payload', [
                'job_id' => $this->jobId,
                'master_slip_id' => $this->masterSlipId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            $this->handleFailure($e);
        }
    }

    protected function loadMasterSlipData()
    {
        $masterSlip = MasterSlip::with([
            'selections.match' => function($query) {
                $query->with([
                    'homeTeam',
                    'awayTeam',
                    'league',
                    'venue',
                    'referee',
                    'markets' => function($q) {
                        $q->orderBy('market_type')->orderBy('odds');
                    },
                ]);
            },
            'selections.selectedMarket',
        ])->findOrFail($this->masterSlipId);

        if ($masterSlip->selections->count() < 2) {
            throw new \Exception('Master slip must contain at least 2 matches for alternative slip generation');
        }

        return $masterSlip;
    }

    protected function preparePythonPayload(
        $masterSlip,
        TeamFormService $teamFormService,
        HeadToHeadService $headToHeadService,
        MarketDataService $marketDataService
    ): array {
        $matches = [];
        
        foreach ($masterSlip->selections as $selection) {
            $match = $selection->match;
            $matches[] = $this->formatMatchData(
                $match,
                $selection,
                $teamFormService,
                $headToHeadService,
                $marketDataService
            );
        }

        return [
            'master_slip' => [
                'master_slip_id' => $this->jobId,
                'stake' => (float) $masterSlip->stake,
                'currency' => $masterSlip->currency ?? 'EUR',
                'created_at' => Carbon::now()->toIso8601String(),
                'total_matches' => count($matches),
                'risk_profile' => $this->determineRiskProfile($masterSlip),
                'matches' => $matches,
            ]
        ];
    }

    protected function formatMatchData(
        $match,
        $selection,
        TeamFormService $teamFormService,
        HeadToHeadService $headToHeadService,
        MarketDataService $marketDataService
    ): array {
        // Get form data
        $homeForm = $teamFormService->getFormData($match->home_team_id, 'home', 5);
        $awayForm = $teamFormService->getFormData($match->away_team_id, 'away', 5);
        
        // Get head-to-head data
        $h2hData = $headToHeadService->getHeadToHeadData($match->home_team_id, $match->away_team_id, 5);
        
        // Get model inputs
        $modelInputs = $marketDataService->getPredictionInputs($match->id);

        return [
            'match_id' => $match->external_id ?? $match->id,
            'league' => $match->league->name,
            'competition' => $match->league->competition_name ?? $match->league->name,
            'season' => $match->season,
            'match_date' => $match->match_date->format('Y-m-d'),
            'match_time' => $match->match_time,
            'venue' => $match->venue->name,
            'venue_capacity' => $match->venue->capacity,
            'city' => $match->venue->city,
            'country' => $match->venue->country,
            'weather' => $this->getDefaultWeather($match->venue),
            'pitch_type' => $match->venue->pitch_type ?? 'hybrid',
            'referee' => $match->referee->name,
            'home_team' => $match->homeTeam->name,
            'away_team' => $match->awayTeam->name,
            'home_team_rank' => $match->homeTeam->current_rank ?? 0,
            'away_team_rank' => $match->awayTeam->current_rank ?? 0,
            'home_team_avg_goals' => $match->homeTeam->avg_goals_scored ?? 1.5,
            'away_team_avg_goals' => $match->awayTeam->avg_goals_scored ?? 1.2,
            'home_form' => $this->formatTeamForm($homeForm),
            'away_form' => $this->formatTeamForm($awayForm),
            'head_to_head' => $this->formatHeadToHead($h2hData, $match->homeTeam, $match->awayTeam),
            'selected_market' => $this->formatSelectedMarket($selection),
            'full_markets' => $this->formatFullMarkets($match->markets),
            'model_inputs' => $this->formatModelInputs($modelInputs, $match),
        ];
    }

    protected function getDefaultWeather($venue): array
    {
        // Simple weather defaults based on country and season
        $country = $venue->country ?? 'England';
        $month = Carbon::now()->month;
        
        // Northern hemisphere countries
        $northernCountries = ['England', 'Germany', 'Italy', 'Spain', 'France', 'Netherlands', 'Portugal'];
        
        if (in_array($country, $northernCountries)) {
            if ($month >= 3 && $month <= 5) {
                // Spring
                return [
                    'temperature' => round(15.0 + rand(-3, 3), 1),
                    'condition' => $this->getRandomCondition(['clear' => 40, 'partly_cloudy' => 30, 'cloudy' => 20, 'light_rain' => 10]),
                    'wind_speed' => round(12.0 + rand(-2, 2), 1),
                ];
            } elseif ($month >= 6 && $month <= 8) {
                // Summer
                return [
                    'temperature' => round(22.0 + rand(-3, 3), 1),
                    'condition' => $this->getRandomCondition(['clear' => 60, 'partly_cloudy' => 25, 'cloudy' => 10, 'thunderstorm' => 5]),
                    'wind_speed' => round(8.0 + rand(-2, 2), 1),
                ];
            } elseif ($month >= 9 && $month <= 11) {
                // Autumn
                return [
                    'temperature' => round(14.0 + rand(-3, 3), 1),
                    'condition' => $this->getRandomCondition(['partly_cloudy' => 30, 'cloudy' => 40, 'light_rain' => 20, 'rain' => 10]),
                    'wind_speed' => round(15.0 + rand(-2, 2), 1),
                ];
            } else {
                // Winter
                return [
                    'temperature' => round(5.0 + rand(-3, 3), 1),
                    'condition' => $this->getRandomCondition(['cloudy' => 40, 'clear' => 30, 'fog' => 15, 'snow' => 15]),
                    'wind_speed' => round(18.0 + rand(-2, 2), 1),
                ];
            }
        }
        
        // Default for other countries
        return [
            'temperature' => round(18.0 + rand(-5, 5), 1),
            'condition' => $this->getRandomCondition(['clear' => 50, 'partly_cloudy' => 30, 'cloudy' => 15, 'light_rain' => 5]),
            'wind_speed' => round(10.0 + rand(-3, 3), 1),
        ];
    }

    protected function getRandomCondition(array $weights): string
    {
        $total = array_sum($weights);
        $random = rand(1, $total);
        $current = 0;
        
        foreach ($weights as $condition => $weight) {
            $current += $weight;
            if ($random <= $current) {
                return $condition;
            }
        }
        
        return 'clear';
    }

    protected function formatTeamForm(array $formData): array
    {
        return [
            'form_string' => $formData['form_string'] ?? 'WWWWW',
            'matches_played' => $formData['matches_played'] ?? 5,
            'wins' => $formData['wins'] ?? 5,
            'draws' => $formData['draws'] ?? 0,
            'losses' => $formData['losses'] ?? 0,
            'avg_goals_scored' => $formData['avg_goals_scored'] ?? 2.0,
            'avg_goals_conceded' => $formData['avg_goals_conceded'] ?? 0.5,
            'form_rating' => $formData['form_rating'] ?? 9.0,
            'form_momentum' => $formData['form_momentum'] ?? 'positive',
            'raw_form' => array_map(function($match) {
                return [
                    'result' => $match['result'] ?? 'W',
                    'score' => $match['score'] ?? '2-0',
                    'opponent' => $match['opponent'] ?? 'Unknown',
                ];
            }, $formData['last_matches'] ?? array_fill(0, 5, [])),
        ];
    }

    protected function formatHeadToHead(array $h2hData, $homeTeam, $awayTeam): array
    {
        $totalMatches = count($h2hData['last_meetings'] ?? []);
        
        return [
            'total_matches' => $h2hData['total_matches'] ?? $totalMatches,
            'home_wins' => $h2hData['team1_wins'] ?? ($totalMatches > 0 ? ceil($totalMatches * 0.6) : 0),
            'away_wins' => $h2hData['team2_wins'] ?? ($totalMatches > 0 ? ceil($totalMatches * 0.2) : 0),
            'draws' => $h2hData['draws'] ?? ($totalMatches > 0 ? ceil($totalMatches * 0.2) : 0),
            'avg_goals_per_match' => $h2hData['avg_goals'] ?? 2.5,
            'last_5_meetings' => array_map(function($meeting) {
                return [
                    'date' => $meeting['date'] ?? '2024-01-01',
                    'score' => $meeting['score'] ?? '2-0',
                    'venue' => $meeting['venue'] ?? 'Unknown',
                    'winner' => $meeting['winner'] ?? 'Home',
                ];
            }, $h2hData['last_meetings'] ?? array_fill(0, min(5, $totalMatches), [])),
        ];
    }

    protected function formatSelectedMarket($selection): array
    {
        $selectedMarket = $selection->selectedMarket ?? null;
        
        if (!$selectedMarket) {
            // Fallback to first market or default
            return [
                'market_type' => '1X2',
                'selection' => 'Home',
                'odds' => 1.85,
                'implied_probability' => 0.54,
                'confidence_rating' => 7.0,
            ];
        }

        return [
            'market_type' => $selectedMarket->market_type,
            'selection' => $selectedMarket->selection,
            'odds' => (float) $selectedMarket->odds,
            'implied_probability' => (float) $selectedMarket->implied_probability,
            'confidence_rating' => (float) $selectedMarket->confidence_rating,
        ];
    }

    protected function formatFullMarkets($markets): array
    {
        $marketGroups = $this->groupMarketsByType($markets);
        
        $formattedMarkets = [];
        
        foreach ($this->getRequiredMarketTypes() as $marketType) {
            $marketOptions = $marketGroups[$marketType] ?? [];
            $formattedMarkets[] = [
                'market_name' => $marketType,
                'options' => $this->formatMarketOptions($marketOptions, $marketType),
            ];
        }

        return $formattedMarkets;
    }

    protected function groupMarketsByType($markets)
    {
        $groups = [];
        
        foreach ($markets as $market) {
            $marketType = $this->normalizeMarketType($market->market_type);
            if (!isset($groups[$marketType])) {
                $groups[$marketType] = [];
            }
            $groups[$marketType][] = $market;
        }
        
        return $groups;
    }

    protected function normalizeMarketType($type): string
    {
        $mapping = [
            'correct_score' => 'correct_score',
            '1x2' => '1x2',
            'asian_handicap' => 'asian_handicap',
            'btts' => 'both_teams_to_score',
            'over_under' => 'over_under',
            'ht_result' => 'halftime_result',
            'corners' => 'corners',
        ];
        
        return $mapping[$type] ?? $type;
    }

    protected function getRequiredMarketTypes(): array
    {
        return [
            'correct_score',
            'asian_handicap',
            'both_teams_to_score',
            'over_under',
            'halftime_result',
            'corners',
        ];
    }

    protected function formatMarketOptions($markets, $marketType): array
    {
        if (empty($markets)) {
            return $this->getDefaultMarketOptions($marketType);
        }

        $options = [];
        foreach ($markets as $market) {
            $option = [
                'odds' => (float) $market->odds,
                'implied_probability' => (float) $market->implied_probability,
            ];

            switch ($marketType) {
                case 'correct_score':
                    $option['score'] = $market->selection;
                    break;
                case 'asian_handicap':
                    $option['handicap'] = $market->selection;
                    break;
                case 'both_teams_to_score':
                    $option['selection'] = $market->selection;
                    break;
                case 'over_under':
                    $option['line'] = $market->selection;
                    break;
                case 'halftime_result':
                    $option['selection'] = $market->selection;
                    break;
                case 'corners':
                    $option['type'] = $market->selection_type ?? 'total';
                    $option['line'] = $market->line_value ?? '9.5';
                    break;
                default:
                    $option['selection'] = $market->selection;
            }

            $options[] = $option;
        }

        return $options;
    }

    protected function getDefaultMarketOptions($marketType): array
    {
        $defaults = [
            'correct_score' => [
                ['score' => '1-0', 'odds' => 8.5, 'implied_probability' => 0.118],
                ['score' => '2-0', 'odds' => 7.0, 'implied_probability' => 0.143],
            ],
            'asian_handicap' => [
                ['handicap' => 'Home -0.5', 'odds' => 1.85, 'implied_probability' => 0.541],
                ['handicap' => 'Away +0.5', 'odds' => 2.05, 'implied_probability' => 0.488],
            ],
            'both_teams_to_score' => [
                ['selection' => 'Yes', 'odds' => 1.95, 'implied_probability' => 0.513],
                ['selection' => 'No', 'odds' => 1.85, 'implied_probability' => 0.541],
            ],
            'over_under' => [
                ['line' => 'Over 2.5', 'odds' => 1.85, 'implied_probability' => 0.541],
                ['line' => 'Under 2.5', 'odds' => 2.00, 'implied_probability' => 0.500],
            ],
            'halftime_result' => [
                ['selection' => 'Home', 'odds' => 2.50, 'implied_probability' => 0.400],
                ['selection' => 'Draw', 'odds' => 2.20, 'implied_probability' => 0.455],
                ['selection' => 'Away', 'odds' => 3.50, 'implied_probability' => 0.286],
            ],
            'corners' => [
                ['type' => 'total_over', 'line' => '9.5', 'odds' => 1.85, 'implied_probability' => 0.541],
                ['type' => 'total_under', 'line' => '9.5', 'odds' => 1.95, 'implied_probability' => 0.513],
            ],
        ];

        return $defaults[$marketType] ?? [['selection' => 'default', 'odds' => 1.85, 'implied_probability' => 0.54]];
    }

    protected function formatModelInputs($inputs, $match): array
    {
        return [
            'home_form_weight' => $inputs['home_form_weight'] ?? 0.35,
            'away_form_weight' => $inputs['away_form_weight'] ?? 0.25,
            'h2h_weight' => $inputs['h2h_weight'] ?? 0.15,
            'venue_advantage' => $inputs['venue_advantage'] ?? ($match->venue->advantage_factor ?? 0.70),
            'weather_impact' => $this->calculateWeatherImpact($match->venue),
            'referee_bias' => $inputs['referee_bias'] ?? 0.01,
            'expected_goals' => $inputs['expected_goals'] ?? 2.5,
            'home_xg' => $inputs['home_xg'] ?? 1.5,
            'away_xg' => $inputs['away_xg'] ?? 1.0,
            'volatility_score' => $inputs['volatility_score'] ?? 3.0,
        ];
    }

    protected function calculateWeatherImpact($venue): float
    {
        // Simple weather impact calculation based on default weather
        $weather = $this->getDefaultWeather($venue);
        
        $impact = 0;
        
        // Temperature impact (optimal: 15-20°C)
        $temp = $weather['temperature'];
        if ($temp < 5 || $temp > 30) {
            $impact += 0.03;
        } elseif ($temp < 10 || $temp > 25) {
            $impact += 0.02;
        } elseif ($temp < 15 || $temp > 20) {
            $impact += 0.01;
        }
        
        // Wind impact
        $wind = $weather['wind_speed'];
        if ($wind > 25) {
            $impact += 0.03;
        } elseif ($wind > 15) {
            $impact += 0.02;
        } elseif ($wind > 10) {
            $impact += 0.01;
        }
        
        // Condition impact
        $condition = $weather['condition'];
        if (in_array($condition, ['heavy_rain', 'rain', 'snow', 'thunderstorm'])) {
            $impact += 0.03;
        } elseif (in_array($condition, ['light_rain', 'fog', 'mist'])) {
            $impact += 0.02;
        } elseif ($condition === 'cloudy') {
            $impact += 0.01;
        }
        
        return round($impact, 3);
    }

    protected function determineRiskProfile($masterSlip): string
    {
        $avgOdds = $masterSlip->selections->avg(function($selection) {
            return $selection->selectedMarket->odds ?? 1.85;
        });
        
        if ($avgOdds > 3.0) return 'high';
        if ($avgOdds > 2.0) return 'medium';
        return 'low';
    }

    protected function dispatchToPythonEngine(array $payload): void
    {
        // Dispatch to ProcessPythonRequest for actual engine communication
        ProcessPythonRequest::dispatch(
            config('python.endpoints.generate_slips'),
            $payload,
            'post',
            $this->jobId,
            0,
            $this->predictionType,
            $this->riskProfile
        )->onQueue('python_requests');
        
        Log::debug('Dispatched payload to ProcessPythonRequest', [
            'job_id' => $this->jobId,
            'endpoint' => config('python.endpoints.generate_slips'),
            'prediction_type' => $this->predictionType,
        ]);
    }

    protected function handleFailure(\Exception $e): void
    {
        $masterSlip = MasterSlip::find($this->masterSlipId);
        if ($masterSlip) {
            $masterSlip->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'failed_at' => now(),
            ]);
        }
        
        $this->fail($e);
    }

    public function failed(\Throwable $exception)
    {
        Log::critical('GenerateAlternativeSlipsJob failed', [
            'job_id' => $this->jobId,
            'master_slip_id' => $this->masterSlipId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
        
        $this->handleFailure($exception);
    }
}


/***
 * 
 * 
 usage
 // Dispatch the job
GenerateAlternativeSlipsJob::dispatch(
    $masterSlipId,
    'monte_carlo',  // prediction type
    'high',         // risk profile
    'alt_slip_001'  // optional job ID
)->onQueue('slip_generation');

// This will:
// 1. Load master slip data from database
// 2. Format it exactly as Python engine expects
// 3. Dispatch to ProcessPythonRequest for actual execution
// 4. Update master slip status

*/