<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalysisJob extends Model
{
    //
        protected $casts = [
        'match_ids' => 'array',
        'results' => 'array',
    ];
    
    protected $dates = [
        'started_at',
        'completed_at',
    ];
}
