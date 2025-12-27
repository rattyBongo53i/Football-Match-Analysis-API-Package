<?php
// app/Models/MatchMarket.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchMarket extends Model
{
    use HasFactory;

    protected $table = 'match_markets';
    protected $fillable = [
        'match_id', 'market_id', 'odds', 'market_data', 'is_active'
    ];

    protected $casts = [
        'odds' => 'decimal:3',
        'is_active' => 'boolean',
        'market_data' => 'array'
    ];

    // Relationships
    public function match()
    {
        return $this->belongsTo(MatchModel::class, 'match_id', 'id');
    }

    public function market()
    {
        return $this->belongsTo(Market::class, 'market_id', 'id');
    }

    public function outcomes()
    {
        return $this->hasMany(MatchMarketOutcome::class, 'match_market_id');
    }
}