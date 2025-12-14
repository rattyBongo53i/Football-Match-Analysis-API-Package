<?php
// app/Models/MarketOutcome.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketOutcomes extends Model
{
    use HasFactory;

    protected $table = 'market_outcomes';
    protected $fillable = [
        'market_id',
        'outcome_name',
        'outcome_label',
        'odds_column',
        'is_default',
        'sort_order'
    ];

    protected $casts = ['is_default' => 'boolean'];

    // Relationships
    public function market()
    {
        return $this->belongsTo(Market::class);
    }
}