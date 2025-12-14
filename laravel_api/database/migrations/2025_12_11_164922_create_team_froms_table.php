<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        Schema::create('team_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->string('team_id');
            $table->enum('venue', ['home', 'away', 'neutral']);
            $table->json('raw_form')->nullable();

            $table->integer('matches_played')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);

            $table->integer('goals_scored')->default(0);
            $table->integer('goals_conceded')->default(0);
            $table->float('avg_goals_scored', 4, 2)->default(0);
            $table->float('avg_goals_conceded', 4, 2)->default(0);

            $table->float('form_rating', 4, 2)->default(0);
            $table->float('form_momentum', 4, 2)->default(0);

            $table->integer('clean_sheets')->default(0);
            $table->integer('failed_to_score')->default(0);

            $table->string('form_string', 10)->nullable();

            $table->json('opponent_strength')->nullable();

            $table->float('win_probability', 5, 4)->default(0.33);
            $table->float('draw_probability', 5, 4)->default(0.33);
            $table->float('loss_probability', 5, 4)->default(0.34);

            $table->timestamps();

            $table->unique(['match_id', 'team_id', 'venue']);
            $table->index('match_id');
            $table->index('team_id');
            $table->index('form_rating');
            $table->index('form_momentum');
            $table->index(['team_id', 'venue']);
        });

        DB::statement("
            CREATE VIEW team_form_analysis AS
            SELECT 
                team_id,
                venue,
                AVG(form_rating) as avg_form_rating,
                AVG(form_momentum) as avg_momentum,
                AVG(win_probability) as avg_win_prob,
                SUM(wins) as total_wins,
                SUM(draws) as total_draws,
                SUM(losses) as total_losses,
                AVG(avg_goals_scored) as avg_scored,
                AVG(avg_goals_conceded) as avg_conceded
            FROM team_forms
            GROUP BY team_id, venue
        ");
    }

    public function down()
    {
        DB::statement("DROP VIEW IF EXISTS team_form_analysis");
        Schema::dropIfExists('team_forms');
    }
};
