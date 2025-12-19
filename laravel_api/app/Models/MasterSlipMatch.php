<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterSlipMatch extends Model
{
    //
    protected $table = 'masterslip_matches';

    protected $fillable = [
        'master_slip_id',
        'match_id',
        'analysis',
        'selected_market',
        'markets',
    ];

    protected $casts = [
        'analysis' => 'array',
        'selected_market' => 'array',
        'markets' => 'array',
    ];

    public function masterSlip()
    {
        return $this->belongsTo(MasterSlip::class);
    }

    public function matchModel()
    {
        return $this->belongsTo(MatchModel::class, 'match_id');
    }
}
