<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterSlipSelection extends Model
{
    //
    protected $fillable = ['master_slip_id', 'match_id', 'markets'];
    protected $casts = ['markets' => 'array'];
}
