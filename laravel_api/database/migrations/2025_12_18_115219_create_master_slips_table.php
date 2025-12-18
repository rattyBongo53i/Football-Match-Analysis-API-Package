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
        Schema::create('master_slips', function (Blueprint $table) {
            $table->id();
            $table->decimal('stake', 10, 2)->default(100);
            $table->json('raw_payload')->nullable(); // Store original request for debugging
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_slips');
    }
};
