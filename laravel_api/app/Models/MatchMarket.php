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
        'additional_data' => 'array'
    ];

    // Relationships
    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }
}