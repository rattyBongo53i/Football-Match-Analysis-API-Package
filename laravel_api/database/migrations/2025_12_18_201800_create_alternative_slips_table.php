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
        Schema::create('alternatived_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_slip_id')->constrained()->onDelete('cascade');
            $table->decimal('total_odds', 10, 2);
            $table->decimal('potential_return', 10, 2);
            $table->json('selections');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alternative_slips');
    }
};
