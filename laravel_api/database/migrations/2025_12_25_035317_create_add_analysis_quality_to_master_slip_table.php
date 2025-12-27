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
        $table->enum('analysis_quality', ['pending', 'low', 'medium', 'high', 'premium'])->default('pending');
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
