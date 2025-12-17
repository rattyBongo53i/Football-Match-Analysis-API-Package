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
            $table->string('importance')->nullable();
            $table->string('tv_coverage')->nullable();
            $table->integer('predicted_attendance')->nullable();
            $table->string('weather_conditions')->nullable();
            $table->boolean('for_ml_training')->default(false);
            $table->boolean('prediction_ready')->default(false);
            // $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
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
// 'scheduled','in_progress','completed','cancelled'