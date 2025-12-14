// database/migrations/2024_12_09_000013_create_historical_results_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('historical_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->nullable()->constrained('matches')->onDelete('set null');
            $table->string('home_team');
            $table->string('away_team');
            $table->string('league')->nullable();
            $table->date('match_date');
            $table->json('result');
            $table->json('odds_data')->nullable();
            $table->timestamps();

            $table->index(['home_team', 'away_team', 'match_date']);
            $table->index('league');
            $table->index('match_date');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('historical_results');
    }
};