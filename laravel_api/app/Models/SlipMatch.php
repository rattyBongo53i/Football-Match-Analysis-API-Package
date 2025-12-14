<?php
// app/Models/SlipMatch.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlipMatch extends Model
{
    use HasFactory;

    protected $table = 'slip_matches';
    protected $fillable = [
        'slip_id', 'match_id', 'selected_market_id', 'selected_outcome',
        'selected_odds', 'confidence', 'position'
    ];

    protected $casts = [
        'selected_odds' => 'decimal:3',
        'confidence' => 'decimal:6'
    ];

    // Relationships
    public function slip()
    {
        return $this->belongsTo(Slip::class);
    }

    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function selectedMarket()
    {
        return $this->belongsTo(Market::class, 'selected_market_id');
    }
}