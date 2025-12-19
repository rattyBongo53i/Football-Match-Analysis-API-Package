<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MasterSlip extends Model
{
    //
    use HasFactory;

    protected $fillable = ['stake', 'raw_payload', 'status', 'error_message'];

    protected $casts = [
        'raw_payload' => 'array',
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function selections()
    {
        return $this->hasMany(MasterSlipSelection::class);
    }
    
    public function slips()
    {
        return $this->hasMany(AlternativeSlip::class);
    }
    
    public function matches()
    {
        return $this->hasMany(MasterSlipMatch::class);
    }
}
