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
        Schema::table('matches', function (Blueprint $table) {
            //
                $table->enum('analysis_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
                $table->timestamp('analysis_started_at')->nullable();
                $table->timestamp('analysis_completed_at')->nullable();
                $table->timestamp('analysis_failed_at')->nullable();
                $table->text('analysis_error')->nullable();

                /****
                 * more columns for analysis results
                 * 
                 */

            $table->foreignId('home_team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->foreignId('away_team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->index(['home_team_id', 'away_team_id']);
          });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            //
        });
    }
};
