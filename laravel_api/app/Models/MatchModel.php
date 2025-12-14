<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchModel extends Model
{
    //
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'home_team',
        'away_team',
        'league',
        'match_date',
        'status',
        'sport',
        'home_score',
        'away_score',
    ];

    // =======================
    //      Relationships
    // =======================

    protected $casts = [
        'match_date' => 'datetime'
    ];

    public function headToHead()
    {
        return $this->hasOne(Head_To_Head::class);
    }

    public function teamForms()
    {
        return $this->hasMany(Team_Form::class);
    }

    public function matchMarkets()
    {
        return $this->hasMany(MatchMarket::class);
    }

    public function slipMatches()
    {
        return $this->hasMany(SlipMatch::class);
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class);
    }

    public function historicalResults()
    {
        return $this->hasMany(HistoricalResults::class);
    }
}
