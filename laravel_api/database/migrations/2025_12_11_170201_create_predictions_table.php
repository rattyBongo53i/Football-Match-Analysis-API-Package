// database/migrations/2024_12_09_000012_create_predictions_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->foreignId('model_id')->constrained('ml_models')->onDelete('cascade');
            $table->foreignId('market_id')->constrained('markets')->onDelete('cascade');
            $table->string('predicted_outcome')->nullable();
            $table->decimal('probability', 8, 6)->nullable();
            $table->decimal('confidence', 8, 6)->nullable();
            $table->json('features_used')->nullable();
            $table->timestamps();

            $table->unique(['match_id', 'model_id', 'market_id']);
            $table->index('match_id');
            $table->index('model_id');
            $table->index('market_id');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('predictions');
    }
};