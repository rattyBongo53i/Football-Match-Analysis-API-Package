// database/migrations/2024_12_09_000006_create_markets_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('markets', function (Blueprint $table) {
            $table->id();
            $table->string('category');//market_type
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('min_odds', 8, 3)->nullable();
            $table->decimal('max_odds', 8, 3)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('code');
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    public function down()
    {
        Schema::dropIfExists('markets');
    }
};