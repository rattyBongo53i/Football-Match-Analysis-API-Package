<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'home_team' => 'required|string|max:255',
            'away_team' => 'required|string|max:255',
            'league' => 'required|string|max:255',
            'competition' => 'nullable|string|max:255',
            'match_date' => 'required|date',
            'match_time' => 'nullable|string|max:10',
            'venue' => 'nullable|string|max:255',

            'home_team_form' => 'nullable|array',
            'home_team_form.form_string' => 'nullable|string|max:20',
            'home_team_form.matches_played' => 'nullable|integer|min:0',
            'home_team_form.wins' => 'nullable|integer|min:0',
            'home_team_form.draws' => 'nullable|integer|min:0',
            'home_team_form.losses' => 'nullable|integer|min:0',
            'home_team_form.avg_goals_scored' => 'nullable|numeric|min:0',
            'home_team_form.avg_goals_conceded' => 'nullable|numeric|min:0',
            'home_team_form.form_rating' => 'nullable|numeric|min:0|max:10',
            'home_team_form.form_momentum' => 'nullable|numeric|min:-1|max:1',
            'home_team_form.raw_form' => 'nullable|array',

            'away_team_form' => 'nullable|array',
            'away_team_form.form_string' => 'nullable|string|max:20',
            'away_team_form.matches_played' => 'nullable|integer|min:0',
            'away_team_form.wins' => 'nullable|integer|min:0',
            'away_team_form.draws' => 'nullable|integer|min:0',
            'away_team_form.losses' => 'nullable|integer|min:0',
            'away_team_form.avg_goals_scored' => 'nullable|numeric|min:0',
            'away_team_form.avg_goals_conceded' => 'nullable|numeric|min:0',
            'away_team_form.form_rating' => 'nullable|numeric|min:0|max:10',
            'away_team_form.form_momentum' => 'nullable|numeric|min:-1|max:1',
            'away_team_form.raw_form' => 'nullable|array',

            'head_to_head_stats' => 'nullable|array',
            'head_to_head_stats.home_wins' => 'nullable|integer|min:0',
            'head_to_head_stats.away_wins' => 'nullable|integer|min:0',
            'head_to_head_stats.draws' => 'nullable|integer|min:0',

            'odds' => 'nullable|array',

            'weather_conditions' => 'nullable|string|max:255',
            'referee' => 'nullable|string|max:255',
            'importance' => 'nullable|string|max:50',
            'tv_coverage' => 'nullable|string|max:255',
            'predicted_attendance' => 'nullable|integer|min:0',

            'for_ml_training' => 'nullable|boolean',
            'prediction_ready' => 'nullable|boolean',
            'status' => 'nullable|string|in:scheduled,in_progress,completed,cancelled',
        ];
    }
}