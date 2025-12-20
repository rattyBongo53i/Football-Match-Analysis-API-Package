<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedSlipLeg extends Model
{
    protected $fillable = [
        'match_id',
        'market',
        'selection',
        'odds',
    ];

    public function generatedSlip(): BelongsTo
    {
        return $this->belongsTo(GeneratedSlip::class);
    }
}