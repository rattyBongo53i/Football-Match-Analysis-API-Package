<?php
// app/Services/WeatherService.php

namespace App\Services;

use App\Models\Venue;
use App\Models\Match;
use App\Models\Weather;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class WeatherService
{
    const WEATHER_CACHE_TTL = 3600; // 1 hour
    const WEATHER_API_TIMEOUT = 5;
    
    /**
     * Get weather data for a match
     */
    public function getMatchWeather(int $venueId, $matchDate): array
    {
        $cacheKey = "weather_{$venueId}_" . (is_string($matchDate) ? $matchDate : $matchDate->format('Y-m-d'));
        
        return Cache::remember($cacheKey, self::WEATHER_CACHE_TTL, function () use ($venueId, $matchDate) {
            $venue = Venue::findOrFail($venueId);
            
            // Try to get from database first
            $weather = $this->getStoredWeather($venueId, $matchDate);
            
            if (!$weather) {
                // Fetch from API
                $weather = $this->fetchWeatherFromApi($venue, $matchDate);
                
                // Store for future use
                if ($weather) {
                    $this->storeWeather($venueId, $matchDate, $weather);
                }
            }
            
            return $this->formatWeatherData($weather, $venue);
        });
    }
    
    /**
     * Get stored weather from database
     */
    protected function getStoredWeather(int $venueId, $matchDate): ?array
    {
        $date = is_string($matchDate) ? Carbon::parse($matchDate) : $matchDate;
        
        $weather = Weather::where('venue_id', $venueId)
            ->whereDate('forecast_date', $date->format('Y-m-d'))
            ->first();
        
        if ($weather) {
            return [
                'temperature' => $weather->temperature,
                'condition' => $weather->condition,
                'wind_speed' => $weather->wind_speed,
                'humidity' => $weather->humidity,
                'precipitation' => $weather->precipitation,
                'pressure' => $weather->pressure,
                'visibility' => $weather->visibility,
                'source' => 'database',
                'last_updated' => $weather->updated_at,
            ];
        }
        
        return null;
    }
    
    /**
     * Fetch weather from external API
     */
    protected function fetchWeatherFromApi(Venue $venue, $matchDate): ?array
    {
        $apiKey = config('services.weather.api_key');
        $apiUrl = config('services.weather.api_url');
        
        if (!$apiKey || !$apiUrl) {
            return $this->getDefaultWeather($venue);
        }
        
        try {
            $date = is_string($matchDate) ? Carbon::parse($matchDate) : $matchDate;
            $dateStr = $date->format('Y-m-d');
            
            $response = Http::timeout(self::WEATHER_API_TIMEOUT)
                ->get($apiUrl, [
                    'lat' => $venue->latitude,
                    'lon' => $venue->longitude,
                    'date' => $dateStr,
                    'appid' => $apiKey,
                    'units' => 'metric',
                ]);
            
            if ($response->successful()) {
                $data = $response->json();
                return $this->parseApiWeather($data, $venue);
            }
        } catch (\Exception $e) {
            \Log::warning('Weather API failed', [
                'venue_id' => $venue->id,
                'error' => $e->getMessage(),
            ]);
        }
        
        return $this->getDefaultWeather($venue);
    }
    
    /**
     * Parse API weather response
     */
    protected function parseApiWeather(array $data, Venue $venue): array
    {
        // This will vary based on your weather API provider
        // Example for OpenWeatherMap format
        $main = $data['main'] ?? [];
        $weather = $data['weather'][0] ?? [];
        $wind = $data['wind'] ?? [];
        
        return [
            'temperature' => $main['temp'] ?? 15.0,
            'condition' => $this->mapWeatherCondition($weather['main'] ?? 'Clear'),
            'wind_speed' => $wind['speed'] ?? 10.0,
            'humidity' => $main['humidity'] ?? 65,
            'precipitation' => $data['rain']['3h'] ?? $data['rain']['1h'] ?? 0,
            'pressure' => $main['pressure'] ?? 1013,
            'visibility' => $data['visibility'] ?? 10000,
            'source' => 'api',
            'api_data' => $data,
        ];
    }
    
    /**
     * Map weather condition to standardized format
     */
    protected function mapWeatherCondition(string $condition): string
    {
        $conditionMap = [
            'Clear' => 'clear',
            'Sunny' => 'clear',
            'Partly cloudy' => 'partly_cloudy',
            'Cloudy' => 'cloudy',
            'Overcast' => 'overcast',
            'Rain' => 'rain',
            'Light rain' => 'light_rain',
            'Heavy rain' => 'heavy_rain',
            'Thunderstorm' => 'thunderstorm',
            'Snow' => 'snow',
            'Fog' => 'fog',
            'Mist' => 'mist',
        ];
        
        return $conditionMap[$condition] ?? 'clear';
    }
    
    /**
     * Get default weather based on venue location and season
     */
    protected function getDefaultWeather(Venue $venue): array
    {
        $season = $this->getSeason($venue->country);
        $month = Carbon::now()->month;
        
        // Default weather based on season and hemisphere
        $defaults = $this->getSeasonalDefaults($season, $venue->latitude);
        
        // Add some randomness for realism
        return [
            'temperature' => $defaults['temperature'] + rand(-3, 3),
            'condition' => $this->getRandomCondition($defaults['condition_weights']),
            'wind_speed' => $defaults['wind_speed'] + rand(-2, 2),
            'humidity' => $defaults['humidity'] + rand(-10, 10),
            'precipitation' => rand(0, $defaults['max_precipitation']),
            'pressure' => 1013 + rand(-10, 10),
            'visibility' => 10000 - rand(0, 3000),
            'source' => 'default',
            'season' => $season,
        ];
    }
    
    /**
     * Get season based on country and month
     */
    protected function getSeason(string $country): string
    {
        $month = Carbon::now()->month;
        
        // Northern Hemisphere
        $northernCountries = ['England', 'Germany', 'Italy', 'Spain', 'France', 'Netherlands'];
        
        if (in_array($country, $northernCountries)) {
            if ($month >= 3 && $month <= 5) return 'spring';
            if ($month >= 6 && $month <= 8) return 'summer';
            if ($month >= 9 && $month <= 11) return 'autumn';
            return 'winter';
        }
        
        // Southern Hemisphere
        if (in_array($country, ['Australia', 'Brazil', 'Argentina'])) {
            if ($month >= 3 && $month <= 5) return 'autumn';
            if ($month >= 6 && $month <= 8) return 'winter';
            if ($month >= 9 && $month <= 11) return 'spring';
            return 'summer';
        }
        
        // Default to northern hemisphere
        return $this->getNorthernSeason($month);
    }
    
    /**
     * Get northern hemisphere season
     */
    protected function getNorthernSeason(int $month): string
    {
        if ($month >= 3 && $month <= 5) return 'spring';
        if ($month >= 6 && $month <= 8) return 'summer';
        if ($month >= 9 && $month <= 11) return 'autumn';
        return 'winter';
    }
    
    /**
     * Get seasonal defaults
     */
    protected function getSeasonalDefaults(string $season, ?float $latitude = null): array
    {
        $defaults = [
            'spring' => [
                'temperature' => 15.0,
                'condition_weights' => ['clear' => 40, 'partly_cloudy' => 30, 'cloudy' => 20, 'light_rain' => 10],
                'wind_speed' => 12.0,
                'humidity' => 70,
                'max_precipitation' => 5,
            ],
            'summer' => [
                'temperature' => 22.0,
                'condition_weights' => ['clear' => 60, 'partly_cloudy' => 25, 'cloudy' => 10, 'thunderstorm' => 5],
                'wind_speed' => 8.0,
                'humidity' => 65,
                'max_precipitation' => 10,
            ],
            'autumn' => [
                'temperature' => 14.0,
                'condition_weights' => ['partly_cloudy' => 30, 'cloudy' => 40, 'light_rain' => 20, 'rain' => 10],
                'wind_speed' => 15.0,
                'humidity' => 75,
                'max_precipitation' => 15,
            ],
            'winter' => [
                'temperature' => 5.0,
                'condition_weights' => ['cloudy' => 40, 'clear' => 30, 'fog' => 15, 'snow' => 15],
                'wind_speed' => 18.0,
                'humidity' => 80,
                'max_precipitation' => 20,
            ],
        ];
        
        $seasonDefaults = $defaults[$season] ?? $defaults['spring'];
        
        // Adjust for latitude (colder at higher latitudes)
        if ($latitude !== null) {
            $latAdjustment = abs($latitude) / 90 * 10; // Up to 10°C adjustment
            if ($latitude > 0) { // Northern hemisphere
                $seasonDefaults['temperature'] -= $latAdjustment * 0.5;
            }
        }
        
        return $seasonDefaults;
    }
    
    /**
     * Get random condition based on weights
     */
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
    
    /**
     * Store weather data in database
     */
    protected function storeWeather(int $venueId, $matchDate, array $weatherData): void
    {
        try {
            $date = is_string($matchDate) ? Carbon::parse($matchDate) : $matchDate;
            
            Weather::updateOrCreate(
                [
                    'venue_id' => $venueId,
                    'forecast_date' => $date->format('Y-m-d'),
                ],
                [
                    'temperature' => $weatherData['temperature'],
                    'condition' => $weatherData['condition'],
                    'wind_speed' => $weatherData['wind_speed'],
                    'humidity' => $weatherData['humidity'] ?? 65,
                    'precipitation' => $weatherData['precipitation'] ?? 0,
                    'pressure' => $weatherData['pressure'] ?? 1013,
                    'visibility' => $weatherData['visibility'] ?? 10000,
                    'source' => $weatherData['source'],
                    'data' => $weatherData['api_data'] ?? null,
                ]
            );
        } catch (\Exception $e) {
            \Log::error('Failed to store weather data', [
                'venue_id' => $venueId,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Format weather data for output
     */
    protected function formatWeatherData(?array $weatherData, Venue $venue): array
    {
        if (!$weatherData) {
            $weatherData = $this->getDefaultWeather($venue);
        }
        
        return [
            'temperature' => round($weatherData['temperature'], 1),
            'condition' => $weatherData['condition'],
            'wind_speed' => round($weatherData['wind_speed'], 1),
            'humidity' => $weatherData['humidity'] ?? 65,
            'precipitation' => $weatherData['precipitation'] ?? 0,
            'pressure' => $weatherData['pressure'] ?? 1013,
            'visibility' => $weatherData['visibility'] ?? 10000,
            'source' => $weatherData['source'] ?? 'default',
            'impact_score' => $this->calculateWeatherImpact($weatherData),
            'description' => $this->generateWeatherDescription($weatherData),
        ];
    }
    
    /**
     * Calculate weather impact score (0-10, higher = more impact)
     */
    protected function calculateWeatherImpact(array $weatherData): float
    {
        $impact = 0;
        
        // Temperature impact (optimal: 15-20°C)
        $temp = $weatherData['temperature'];
        if ($temp < 5 || $temp > 30) {
            $impact += 3;
        } elseif ($temp < 10 || $temp > 25) {
            $impact += 2;
        } elseif ($temp < 15 || $temp > 20) {
            $impact += 1;
        }
        
        // Wind impact
        $wind = $weatherData['wind_speed'];
        if ($wind > 25) {
            $impact += 3;
        } elseif ($wind > 15) {
            $impact += 2;
        } elseif ($wind > 10) {
            $impact += 1;
        }
        
        // Precipitation impact
        $precip = $weatherData['precipitation'] ?? 0;
        if ($precip > 10) {
            $impact += 3;
        } elseif ($precip > 5) {
            $impact += 2;
        } elseif ($precip > 1) {
            $impact += 1;
        }
        
        // Condition impact
        $condition = $weatherData['condition'];
        $conditionImpact = [
            'clear' => 0,
            'partly_cloudy' => 0.5,
            'cloudy' => 1,
            'light_rain' => 2,
            'rain' => 3,
            'heavy_rain' => 4,
            'thunderstorm' => 5,
            'snow' => 4,
            'fog' => 3,
            'mist' => 2,
        ];
        
        $impact += $conditionImpact[$condition] ?? 1;
        
        return round(min(10, $impact), 1);
    }
    
    /**
     * Generate weather description
     */
    protected function generateWeatherDescription(array $weatherData): string
    {
        $temp = $weatherData['temperature'];
        $condition = $weatherData['condition'];
        $wind = $weatherData['wind_speed'];
        
        $tempDesc = $this->describeTemperature($temp);
        $conditionDesc = str_replace('_', ' ', $condition);
        $windDesc = $this->describeWind($wind);
        
        return "{$tempDesc} with {$conditionDesc}. {$windDesc}";
    }
    
    /**
     * Describe temperature
     */
    protected function describeTemperature(float $temp): string
    {
        if ($temp < 0) return 'Freezing';
        if ($temp < 5) return 'Very cold';
        if ($temp < 10) return 'Cold';
        if ($temp < 15) return 'Cool';
        if ($temp < 20) return 'Mild';
        if ($temp < 25) return 'Warm';
        if ($temp < 30) return 'Hot';
        return 'Very hot';
    }
    
    /**
     * Describe wind speed
     */
    protected function describeWind(float $windSpeed): string
    {
        if ($windSpeed < 5) return 'Light breeze';
        if ($windSpeed < 10) return 'Moderate breeze';
        if ($windSpeed < 15) return 'Fresh breeze';
        if ($windSpeed < 20) return 'Strong wind';
        if ($windSpeed < 25) return 'Very strong wind';
        return 'Gale force winds';
    }
    
    /**
     * Get weather impact on match prediction
     */
    public function getWeatherImpact(array $weatherData): array
    {
        $impact = $this->calculateWeatherImpact($weatherData);
        
        return [
            'impact_score' => $impact,
            'affects_passing' => $impact > 3,
            'affects_shooting' => $impact > 4,
            'affects_visibility' => in_array($weatherData['condition'], ['fog', 'mist', 'heavy_rain']),
            'preferred_style' => $this->getPreferredPlayingStyle($weatherData),
            'home_advantage_multiplier' => $this->getHomeAdvantageMultiplier($weatherData),
        ];
    }
    
    /**
     * Get preferred playing style in given weather
     */
    protected function getPreferredPlayingStyle(array $weatherData): string
    {
        $condition = $weatherData['condition'];
        $wind = $weatherData['wind_speed'];
        
        if (in_array($condition, ['heavy_rain', 'rain', 'snow'])) {
            return 'direct';
        }
        
        if ($wind > 15) {
            return 'ground_play';
        }
        
        if (in_array($condition, ['clear', 'partly_cloudy'])) {
            return 'possession';
        }
        
        return 'balanced';
    }
    
    /**
     * Get home advantage multiplier
     */
    protected function getHomeAdvantageMultiplier(array $weatherData): float
    {
        $impact = $this->calculateWeatherImpact($weatherData);
        
        // Extreme weather increases home advantage (familiarity with conditions)
        if ($impact > 7) {
            return 1.3;
        }
        
        if ($impact > 5) {
            return 1.2;
        }
        
        if ($impact > 3) {
            return 1.1;
        }
        
        return 1.0;
    }
}