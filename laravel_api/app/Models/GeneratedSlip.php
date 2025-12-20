<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneratedSlip extends Model
{
    protected $fillable = [
        'slip_id',
        'stake',
        'total_odds',
        'possible_return',
        'risk_level',
        'confidence_score',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
    ];

    public function masterSlip(): BelongsTo
    {
        return $this->belongsTo(MasterSlip::class);
    }

    public function legs(): HasMany
    {
        return $this->hasMany(GeneratedSlipLeg::class);
    }
}