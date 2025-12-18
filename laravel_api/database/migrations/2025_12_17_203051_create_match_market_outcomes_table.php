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
        Schema::create('match_market_outcomes', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('match_market_id')
                ->constrained('match_markets')
                ->cascadeOnDelete();

            $table->string('outcome_key', 50); // win, draw, over, under
            $table->string('label', 100)->nullable();

            $table->decimal('odds', 8, 3)->default(0);

            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort_order')->default(1);

            $table->timestamps();

            $table->unique(
                ['match_market_id', 'outcome_key'],
                'mm_outcome_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_market_outcomes');
    }
};
