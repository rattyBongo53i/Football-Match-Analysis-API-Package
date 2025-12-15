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
        Schema::create('generator_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique();
            $table->foreignId('master_slip_id')->constrained('slips');
            $table->string('strategy');
            $table->json('options')->nullable();
            $table->string('status')->default('pending');
            $table->integer('progress')->default(0);
            $table->integer('total_slips')->default(0);
            $table->integer('generated_slips')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generator_jobs');
    }
};
