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
        Schema::create('generated_slip_legs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_slip_id')->constrained()->cascadeOnDelete();
            $table->string('match_id');
            $table->string('market');
            $table->string('selection');
            $table->decimal('odds', 10, 4);
            $table->timestamps();

            $table->index('generated_slip_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_slip_legs');
    }
};
