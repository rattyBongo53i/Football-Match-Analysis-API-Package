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
              //  $table->enum('analysis_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
             //   $table->timestamp('analysis_started_at')->nullable();
              //  $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            //     $table->json('home_form')->nullable(); // JSON column for form data
            //     $table->json('away_form')->nullable(); // JSON column for form data
            //     $table->json('head_to_head')->nullable(); // JSON column for H2H data
            //  //   $table->text('notes')->nullable();
            //     $table->timestamp('analysis_completed_at')->nullable();
            //      $table->string('venue')->nullable();
                $table->timestamp('analysis_failed_at')->nullable();
                $table->text('analysis_error')->nullable();

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
