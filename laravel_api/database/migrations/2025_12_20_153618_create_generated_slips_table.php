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
        Schema::create('generated_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_slip_id')->constrained()->cascadeOnDelete();
            $table->string('slip_id')->unique(); // e.g. SLIP-12485A
            $table->decimal('stake', 10, 4);
            $table->decimal('total_odds', 10, 4);
            $table->decimal('possible_return', 10, 4);
            $table->string('risk_level');
            $table->decimal('confidence_score', 8, 4);
            $table->json('raw_data')->nullable();
            $table->timestamps();

            $table->index(['master_slip_id', 'confidence_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_slips');
    }
};
