// database/migrations/2024_12_09_000007_create_market_outcomes_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('market_outcomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('market_id')->constrained('markets')->onDelete('cascade');
            $table->string('outcome_name');//outcome // e.g., '1', 'X', '2', 'Over 2.5'
            $table->string('outcome_label')->nullable();
            $table->string('odds_column')->nullable();
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['market_id', 'outcome_name']);
            $table->index('market_id');
            $table->index('outcome_name');
        });
    }

    public function down()
    {
        Schema::dropIfExists('market_outcomes');
    }
};