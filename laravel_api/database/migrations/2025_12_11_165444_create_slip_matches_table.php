// database/migrations/2024_12_09_000010_create_slip_matches_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('slip_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('slip_id')->constrained('slips')->onDelete('cascade');
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->foreignId('selected_market_id')->nullable()->constrained('markets')->onDelete('set null');
            $table->string('selected_outcome')->nullable();
            $table->decimal('selected_odds', 8, 3)->nullable();
            $table->decimal('confidence', 8, 6)->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->unique(['slip_id', 'match_id', 'selected_market_id']);
            $table->index('slip_id');
            $table->index('match_id');
            $table->index('selected_market_id');
            $table->index('position');
        });
    }

    public function down()
    {
        Schema::dropIfExists('slip_matches');
    }
};