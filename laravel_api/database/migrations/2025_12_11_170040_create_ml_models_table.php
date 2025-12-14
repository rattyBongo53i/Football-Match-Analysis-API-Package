<?php
// database/migrations/2024_12_09_000011_create_ml_models_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('ml_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('version')->default('1.0');
            $table->string('model_type')->nullable();
            $table->text('path');
            $table->json('metrics')->nullable();
            $table->json('features_used')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['name', 'version']);
            $table->index('is_active');
            $table->index('model_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ml_models');
    }
};