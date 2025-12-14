<?php
// database/migrations/2024_12_09_000002_create_projects_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('settings')->nullable();
            $table->decimal('bankroll', 10, 2)->default(1000.00);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('projects');
    }
};