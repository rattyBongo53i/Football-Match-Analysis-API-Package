<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlternativeSlip extends Model
{
    //
    protected $table = 'alternatived_slips';
    protected $fillable = ['master_slip_id', 'total_odds', 'potential_return', 'selections'];

    protected $casts = ['selections' => 'array'];
}

// NB:: i changed the model to point to a table called alternatived_slips because in the migration file it was created with that name. 
//this was done on purpose because i already have a table created by my initial migration file also called alternative_slips.