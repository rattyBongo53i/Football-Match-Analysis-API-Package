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
        Schema::create('master_slip_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_slip_id')->constrained()->cascadeOnDelete();
            $table->foreignId('match_id')->constrained('matches');
            $table->json('markets'); // [{ type: "1X2", selection: "home", odds: 1.85 }]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_slip_selections');
    }
};
