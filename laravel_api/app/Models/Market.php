<?php
// app/Models/Market.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Market extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'name',
        'code',
        'description',
        'is_active',
        'min_odds',
        'max_odds',
        'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_odds' => 'decimal:3',
        'max_odds' => 'decimal:3'
    ];

    // Relationships
    public function outcomes()
    {
        return $this->hasMany(MarketOutcomes::class);
    }

    public function matchMarkets()
    {
        return $this->hasMany(MatchMarket::class);
    }

    public function slipMatches()
    {
        return $this->hasMany(SlipMatch::class, 'selected_market_id');
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class);
    }
}