<?php
// app/Models/Project.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'settings',
        'bankroll',
        'status'
    ];

    protected $casts = [
        'bankroll' => 'decimal:2',
        'settings' => 'array'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function slips()
    {
        return $this->hasMany(Slip::class);
    }
}



