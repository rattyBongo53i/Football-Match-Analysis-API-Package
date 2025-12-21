<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MatchMarketOutcome extends Model
{
    //
    use HasFactory;

    protected $table = 'match_market_outcomes';

    protected $fillable = [
        'match_market_id',
        'outcome_key',
        'label',
        'odds',
        'is_default',
        'sort_order',
        'outcome',
    ];

    protected $casts = [
        'odds' => 'decimal:3',
        'is_default' => 'boolean',
    ];

    // Relationships
    public function matchMarket()
    {
        return $this->belongsTo(MatchMarket::class);
    }
}
