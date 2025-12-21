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
        Schema::table('master_slips', function (Blueprint $table) {
            //
            $table->integer('alternative_slips_count')->default(0);
            $table->foreignId('best_alternative_slip_id')->nullable()->constrained('alternative_slips')->onDelete('set null');
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('processing_completed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_slips', function (Blueprint $table) {
            //
        });
    }
};

