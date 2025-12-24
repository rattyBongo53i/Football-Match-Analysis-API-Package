<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;

class MasterSlipMatch extends Pivot  // Changed from Model to Pivot
{
    protected $table = 'master_slip_matches';

    // Add incrementing if you want auto-increment IDs in pivot table
    public $incrementing = true;

    protected $fillable = [
        'master_slip_id',
        'match_id',
        'analysis',
        'selected_market',
        'markets',
        'selection',
        'odds',
        'match_data'
    ];

    protected $casts = [
        'analysis' => 'array',
        'selected_market' => 'array',
        'markets' => 'array',
        'odds' => 'float',
        'match_data' => 'array'
    ];



    public function matchModel()
    {
        return $this->belongsTo(MatchModel::class, 'match_id', 'id');
        
    }

    public function masterSlip()
    {
        // return $this->belongsTo(MasterSlip::class);
        return $this->belongsTo(MasterSlip::class, 'master_slip_id', 'id');
    }

    public function match()
    {
        return $this->belongsTo(MatchModel::class, 'match_id', 'id');
    }
}
