<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'home_team' => 'sometimes|string|max:255',
            'away_team' => 'sometimes|string|max:255',
            'league' => 'sometimes|string|max:255',
            'competition' => 'nullable|string|max:255',
            'match_date' => 'sometimes|date',
            'match_time' => 'nullable|string|max:10',
            'venue' => 'nullable|string|max:255',

            'home_team_form' => 'nullable|array',
            'away_team_form' => 'nullable|array',
            'head_to_head_stats' => 'nullable|array',
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