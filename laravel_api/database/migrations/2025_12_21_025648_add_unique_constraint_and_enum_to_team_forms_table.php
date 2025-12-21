<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First: Change 'venue' column to enum if it isn't already
        Schema::table('team_forms', function (Blueprint $table) {
            // Drop foreign key if exists (optional, only if you have one)
            // $table->dropForeign(['match_id']);

            // Change column to enum (this works if column already exists as string/varchar)
            $table->enum('venue', ['home', 'away'])->default('home')->change();
        });

        // Second: Add the composite unique index
        // We wrap this in a raw DB statement because Laravel doesn't support composite unique directly in change()
        DB::statement('ALTER TABLE team_forms ADD UNIQUE unique_match_team_venue (match_id, team_id, venue)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the unique constraint
        DB::statement('ALTER TABLE team_forms DROP INDEX unique_match_team_venue');

        // Revert venue back to string (optional - only if you want full reversibility)
        Schema::table('team_forms', function (Blueprint $table) {
            $table->string('venue')->default('home')->change();
        });
    }
};