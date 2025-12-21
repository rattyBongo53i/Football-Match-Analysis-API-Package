<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterSlipMatch extends Model
{
    //
    protected $table = 'master_slip_matches';

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
        'odds' => 'decimal:2',
        'match_data' => 'array'
    ];



    public function matchModel()
    {
        return $this->belongsTo(MatchModel::class, 'match_id');
    }

    public function masterSlip()
    {
        return $this->belongsTo(MasterSlip::class);
    }

    public function match()
    {
        return $this->belongsTo(MatchModel::class, 'match_id');
    }
}
