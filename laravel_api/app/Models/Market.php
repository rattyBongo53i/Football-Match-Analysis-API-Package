<?php
// app/Models/Market.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Market extends Model
{
    use HasFactory;

    protected $fillable = [
        'market_type',
        'name',
        'code',
        'description',
        'is_active',
        'min_odds',
        'max_odds',
        'sort_order',
        'odds',
        'slug',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_odds' => 'decimal:3',
        'max_odds' => 'decimal:3',
        'odds' => 'array',
    ];

    // Relationships


    public function matches()
    {
        return $this->belongsToMany(MatchModel::class, 'match_markets', 'market_id', 'match_id')
            ->withPivot('market_data')
            ->withTimestamps();
    }
    public function outcomes()
    {
        return $this->hasMany(MarketOutcomes::class, 'market_id', 'id');
    }

    public function matchMarkets()
    {
        return $this->hasMany(MatchMarket::class, 'market_id', 'id');
    }

    public function slipMatches()
    {
        return $this->hasMany(SlipMatch::class, 'selected_market_id', 'id');
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'market_id', 'id');
    }
}