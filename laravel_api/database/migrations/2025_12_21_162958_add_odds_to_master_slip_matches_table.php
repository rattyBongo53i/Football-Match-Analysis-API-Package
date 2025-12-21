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
        Schema::table('master_slip_matches', function (Blueprint $table) {
            //
            $table->string('selection')->nullable();
            $table->decimal('odds', 8, 2)->nullable();
            $table->json('match_data')->nullable();

            // $table->unique(['master_slip_id', 'match_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_slip_markets', function (Blueprint $table) {
            //
        });
    }
};
