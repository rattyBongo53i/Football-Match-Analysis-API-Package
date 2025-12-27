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
            //
            $table->dropUnique(['match_id', 'team_id', 'venue']); // drop old
            $table->integer('team_id')->unsigned()->change();
            $table->foreign('team_id')->references('id')->on('teams');
            $table->unique(['match_id', 'team_id', 'venue']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_forms', function (Blueprint $table) {
            //
            
        });
    }
};
