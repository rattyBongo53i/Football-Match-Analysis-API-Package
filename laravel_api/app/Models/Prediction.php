<?php
// app/Models/Prediction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id', 'model_id', 'market_id', 'predicted_outcome',
        'probability', 'confidence', 'features_used'
    ];

    protected $casts = [
        'probability' => 'decimal:6',
        'confidence' => 'decimal:6',
        'features_used' => 'array'
    ];

    // Relationships
    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function model()
    {
        return $this->belongsTo(MLModels::class, 'model_id');
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }
}