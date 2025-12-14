// database/migrations/2024_12_09_000008_create_match_markets_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('match_markets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->foreignId('market_id')->constrained('markets')->onDelete('cascade');
            $table->decimal('odds', 8, 3)->nullable();
            $table->json('additional_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['match_id', 'market_id']);
            $table->index('match_id');
            $table->index('market_id');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('match_markets');
    }
};