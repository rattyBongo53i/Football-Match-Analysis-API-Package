<?php
// app/Models/Slip.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Slip extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'user_id', 'project_id', 'master_slip_id',
        'status', 'total_odds', 'stake', 'potential_payout', 'confidence_score',
        'risk_level', 'selections'
    ];

    protected $casts = [
        'total_odds' => 'decimal:6',
        'stake' => 'decimal:2',
        'potential_payout' => 'decimal:2',
        'confidence_score' => 'decimal:6',
        'selections' => 'array'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function masterSlip()
    {
        return $this->belongsTo(Slip::class, 'master_slip_id');
    }

    public function childSlips()
    {
        return $this->hasMany(Slip::class, 'master_slip_id');
    }

    public function slipMatches()
    {
        return $this->hasMany(SlipMatch::class);
    }

    public function matches()
    {
        return $this->belongsToMany(MatchModel::class, 'slip_matches')
                    ->withPivot('selected_market_id', 'selected_outcome', 'selected_odds', 'confidence', 'position')
                    ->withTimestamps();
    }
}

