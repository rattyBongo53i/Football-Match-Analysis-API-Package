<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'full_name',
        'role',
        'is_active',
        'preferences'
    ];

    protected $hidden = ['password_hash'];
    protected $casts = [
        'is_active' => 'boolean',
        'preferences' => 'array'
    ];

    // Relationships
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function slips()
    {
        return $this->hasMany(Slip::class);
    }
}