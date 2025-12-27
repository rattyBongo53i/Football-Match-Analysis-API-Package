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
            $table->unsignedBigInteger('home_team_id')->nullable()->after('id');
            $table->unsignedBigInteger('away_team_id')->nullable()->after('home_team_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            //
            $table->dropColumn('home_team_id');
            $table->dropColumn('away_team_id');
        });
    }
};
