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
        Schema::create('master_slip_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_slip_id')->constrained('master_slips')->onDelete('cascade');
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            
            // Pre-computed analysis data (JSON for flexibility)
            $table->json('analysis')->nullable();
            
            // Selected market for this slip (JSON)
            $table->json('selected_market')->nullable();
            
            // All available markets for this match in the slip (JSON)
            $table->json('markets')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Unique constraint: one match per master slip
            $table->unique(['master_slip_id', 'match_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_slip_matches');
    }
};
