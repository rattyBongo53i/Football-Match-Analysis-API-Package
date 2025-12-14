// database/migrations/2024_12_09_000001_create_users_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->text('password_hash');
            $table->string('full_name')->nullable();
            $table->string('role')->default('user');
            $table->boolean('is_active')->default(true);
            $table->json('preferences')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('username');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};