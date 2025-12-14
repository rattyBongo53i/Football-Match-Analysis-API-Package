<?php
// app/Models/MLModel.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MLModels extends Model
{
    use HasFactory;

    protected $table = 'ml_models';
    protected $fillable = [
        'name',
        'version',
        'model_type',
        'path',
        'metrics',
        'features_used',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metrics' => 'array',
        'features_used' => 'array'
    ];

    // Relationships
    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'model_id');
    }
}