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
        Schema::table('team_forms', function (Blueprint $table) {
            // 1. Add match_id (foreign key to matches table)
            // $table->foreignId('match_id')
            //     ->after('id') // optional: position after id
            //     ->constrained('matches')
            //     ->onDelete('cascade');

            // 2. Add team_id as string (to store team code like "VIL", "BAR")
            $table->string('home_team_id', 50)->after('match_id');
            $table->string('away_team_id', 50)->after('home_team_id');

            // 3. Add venue as enum
            $table->enum('venue', ['home', 'away', 'neutral'])
                ->after('away_team_id')
                ->comment('home = team playing at home, away = playing away, neutral = neutral venue');

            // 4. Add timestamps if not already present (optional but recommended)
            // $table->timestamps(); // Uncomment only if you want created_at/updated_at

            // 5. Add composite unique index to prevent duplicates
            $table->unique(['match_id', 'home_team_id', 'away_team_id', 'venue'], 'team_forms_match_id_home_team_id_away_team_id_venue_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_forms', function (Blueprint $table) {
            // Drop the unique index first
            $table->dropUnique('team_forms_match_id_home_team_id_away_team_id_venue_unique');

            // Then drop foreign key and columns
            $table->dropForeign(['match_id']); // drops match_id foreign key
            $table->dropColumn(['match_id', 'home_team_id', 'away_team_id', 'venue']);
        });
    }
};
