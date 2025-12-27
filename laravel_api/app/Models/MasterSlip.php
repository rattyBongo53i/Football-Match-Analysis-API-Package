<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// hasmany
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterSlip extends Model
{
    //
    use HasFactory;

    protected $table = 'master_slips';

    protected $fillable = [
        'user_id',
        'stake',
        'currency',
        'slip_data',
        'status',
        'engine_status',
        'analysis_quality',
        'notes',
        'name',

        'total_odds',
        'estimated_payout',
        'alternative_slips_count',
        'best_alternative_slip_id',
        'processing_started_at',
        'processing_completed_at'
    ];

    protected $casts = [
        'slip_data' => 'array',
        'processing_started_at' => 'datetime',
        'processing_completed_at' => 'datetime',
        'stake' => 'decimal:2',
        'total_odds' => 'decimal:2',
        'estimated_payout' => 'decimal:2',

    ];

    // Relationships
    public function selections()
    {
        return $this->hasMany(MasterSlipSelection::class, 'master_slip_id', 'id');
    }

    public function slips()
    {
        return $this->hasMany(AlternativeSlip::class, 'master_slip_id', 'id');
    }

 
    public function generatedSlips()
    {
        return $this->hasMany(GeneratedSlip::class, 'master_slip_id', 'id');
    }

    // Add user relationship if needed
    public function user()
    {
        return $this->belongsTo(User::class);
    }

       // ====================================================================
    // ADD THIS RELATIONSHIP - This is what your job is looking for
    // ====================================================================
    
    /**
     * Get all slip matches (pivot records) for this master slip
     */
    public function slipMatches(): HasMany
    {
        return $this->hasMany(MasterSlipMatch::class, 'master_slip_id', 'id');
    }

    // ====================================================================
    // ALSO ADD THIS if you need to access the actual Match models
    // ====================================================================

    

    public function matches()
    {
        return $this->belongsToMany(MatchModel::class, 'master_slip_matches', 'master_slip_id', 'match_id')
            ->using(MasterSlipMatch::class)
            ->withPivot('id', 'market', 'selection', 'odds', 'match_data', 'created_at', 'updated_at')
            ->withTimestamps();
    }

    // Best slip relationship
    public function bestSlip()
    {
        return $this->belongsTo(AlternativeSlip::class, 'best_alternative_slip_id', 'id');
    }
}
