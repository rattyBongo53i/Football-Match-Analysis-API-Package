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
        'sort_order',
        'odds'
    ];

    protected $casts = ['is_default' => 'boolean',
              'odds' => 'decimal:2',
     ];

    // Relationships
    public function market()
    {
        return $this->belongsTo(Market::class, 'market_id', 'id');
    }
}