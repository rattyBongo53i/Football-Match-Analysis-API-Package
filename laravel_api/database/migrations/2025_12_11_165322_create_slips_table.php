// database/migrations/2024_12_09_000009_create_slips_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('slips', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->foreignId('master_slip_id')->nullable()->constrained('slips')->onDelete('set null');
            $table->string('status')->default('draft');
            $table->decimal('total_odds', 12, 6)->nullable();
            $table->decimal('stake', 12, 2)->default(0.00);
            $table->decimal('potential_payout', 12, 2)->nullable();
            $table->decimal('confidence_score', 8, 6)->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('medium');
            $table->json('selections')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('project_id');
            $table->index('master_slip_id');
            $table->index('status');
            $table->index('created_at');
            $table->index('risk_level');
        });
    }

    public function down()
    {
        Schema::dropIfExists('slips');
    }
};