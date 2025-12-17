<?php

namespace Database\Seeders;

use App\Models\MLModel;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MLModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
public function run(): void
{
    MLModel::updateOrCreate(
        ['name' => 'statistical'],
        [
            'version' => '1.0',
            'model_type' => 'statistical',
            'path' => 'models/statistical.pkl', // or any placeholder
            'metrics' => ['accuracy' => 0.65],
            'features_used' => ['form_rating', 'head_to_head'],
            'is_active' => true,
        ]
    );
}
}
