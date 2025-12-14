<?php
// database/migrations/2024_12_09_000006_create_teams_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();

            // Basic team information
            $table->string('name');
            $table->string('short_name', 10)->nullable();
            $table->string('code', 5)->unique(); // Unique team code like "MUN", "LIV"
            $table->string('slug')->unique(); // URL-friendly version

            // Team metadata
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('stadium')->nullable();
            $table->integer('founded_year')->nullable();
            $table->string('logo_url')->nullable();

            // Statistical fields (updated regularly)
            $table->float('overall_rating', 3, 1)->default(5.0); // 0-10 scale
            $table->float('attack_rating', 3, 1)->default(5.0);
            $table->float('defense_rating', 3, 1)->default(5.0);
            $table->float('home_strength', 3, 1)->default(5.0);
            $table->float('away_strength', 3, 1)->default(5.0);

            // Current season stats (auto-calculated)
            $table->integer('matches_played')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);

            // Goals statistics
            $table->integer('goals_scored')->default(0);
            $table->integer('goals_conceded')->default(0);
            $table->integer('goal_difference')->default(0);

            // Points and position
            $table->integer('points')->default(0);
            $table->integer('league_position')->nullable();

            // Form analysis
            $table->string('current_form', 10)->nullable(); // Last 5 matches "WWDLW"
            $table->float('form_rating', 4, 2)->default(5.0);
            $table->float('momentum', 4, 2)->default(0); // -1 to 1 scale

            // Advanced metrics
            $table->float('expected_goals_for', 4, 2)->default(0);
            $table->float('expected_goals_against', 4, 2)->default(0);
            $table->float('possession_avg', 4, 1)->default(50.0);
            $table->float('shots_on_target_avg', 4, 2)->default(0);
            $table->float('clean_sheet_percentage', 4, 1)->default(0);
            $table->float('conversion_rate', 4, 1)->default(0);

            // Home/Away specific stats
            $table->json('home_stats')->nullable(); // JSON with home performance
            $table->json('away_stats')->nullable(); // JSON with away performance

            // Recent performance (last 10 matches)
            $table->json('recent_performances')->nullable();

            // Strength indicators
            $table->boolean('is_top_team')->default(false);
            $table->boolean('is_bottom_team')->default(false);
            $table->boolean('has_home_advantage')->default(false);
            $table->boolean('is_improving')->default(false);

            // Betting related data
            $table->float('fair_odds_home_win', 5, 2)->nullable();
            $table->float('fair_odds_draw', 5, 2)->nullable();
            $table->float('fair_odds_away_win', 5, 2)->nullable();

            // Timestamps and soft deletes
            $table->timestamp('last_updated')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index('name');
            $table->index('code');
            $table->index('country');
            $table->index('overall_rating');
            $table->index('form_rating');
            $table->index('league_position');
            $table->index('points');
            $table->index('is_top_team');
            $table->index('is_bottom_team');
            $table->index(['country', 'overall_rating']);
        });

        // Create view for team rankings
        DB::statement("
            CREATE VIEW team_rankings AS
            SELECT 
                id,
                name,
                code,
                country,
                overall_rating,
                form_rating,
                matches_played,
                wins,
                draws,
                losses,
                goals_scored,
                goals_conceded,
                goal_difference,
                points,
                league_position,
                current_form,
                momentum,
                RANK() OVER (ORDER BY overall_rating DESC) as overall_rank,
                RANK() OVER (ORDER BY form_rating DESC) as form_rank,
                RANK() OVER (ORDER BY momentum DESC) as momentum_rank
            FROM teams
            WHERE deleted_at IS NULL
        ");

        // Create view for betting analysis
        DB::statement("
            CREATE VIEW team_betting_stats AS
            SELECT 
                id,
                name,
                code,
                overall_rating,
                form_rating,
                current_form,
                matches_played,
                ROUND(wins * 100.0 / NULLIF(matches_played, 0), 1) as win_percentage,
                ROUND(draws * 100.0 / NULLIF(matches_played, 0), 1) as draw_percentage,
                ROUND(losses * 100.0 / NULLIF(matches_played, 0), 1) as loss_percentage,
                ROUND(goals_scored * 1.0 / NULLIF(matches_played, 0), 2) as avg_goals_scored,
                ROUND(goals_conceded * 1.0 / NULLIF(matches_played, 0), 2) as avg_goals_conceded,
                fair_odds_home_win,
                fair_odds_draw,
                fair_odds_away_win
            FROM teams
            WHERE deleted_at IS NULL AND matches_played > 0
        ");
    }

    public function down()
    {
        DB::statement("DROP VIEW IF EXISTS team_betting_stats");
        DB::statement("DROP VIEW IF EXISTS team_rankings");
        Schema::dropIfExists('teams');
    }
};