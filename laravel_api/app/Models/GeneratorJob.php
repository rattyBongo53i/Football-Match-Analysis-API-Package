<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratorJob extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'job_id',
        'master_slip_id',
        'strategy',
        'options',
        'status',
        'progress',
        'total_slips',
        'generated_slips',
        'started_at',
        'completed_at',
        'cancelled_at',
        'created_by',
        'cancelled_by',
    ];
    
    protected $casts = [
        'options' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];
    
    public function masterSlip(): BelongsTo
    {
        return $this->belongsTo(Slip::class, 'master_slip_id');
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}