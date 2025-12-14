<?php
// database/migrations/2024_12_09_000004_create_head_to_head_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('head_to_head', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');

            // Store as string format for easy readability
            $table->string('form')->nullable(); // e.g., "2-1-2" or "W-D-L-W-D"

            // Store as structured JSON for detailed analysis
            $table->json('stats')->nullable(); // Detailed statistics

            // Store last 5 meetings results
            $table->json('last_meetings')->nullable(); // Array of last meeting results

            // Store individual match results
            $table->integer('home_wins')->default(0);
            $table->integer('away_wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('total_meetings')->default(0);

            // Recent meetings
            $table->string('last_meeting_date')->nullable(); // Date of last meeting
            $table->string('last_meeting_result')->nullable(); // Result of last meeting

            // Goals statistics
            $table->integer('home_goals')->default(0);
            $table->integer('away_goals')->default(0);

            $table->timestamps();

            $table->unique('match_id');
            $table->index('match_id');
            $table->index('form');
        });
    }

    public function down()
    {
        Schema::dropIfExists('head_to_head');
    }
};