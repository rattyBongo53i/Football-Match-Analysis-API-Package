<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
     {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->string('home_team');
            $table->string('away_team');
            $table->string('league')->nullable();
            $table->dateTime('match_date')->nullable();
            $table->string('status')->default('scheduled');
            $table->string('sport')->default('soccer');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->timestamps();
            
            $table->index(['home_team', 'away_team']);
            $table->index('league');
            $table->index('match_date');
            $table->index('status');
            $table->index('sport');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
