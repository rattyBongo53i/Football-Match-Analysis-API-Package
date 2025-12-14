<?php

namespace Database\Seeders;

use App\Models\Head_To_Head;
use App\Models\MatchModel;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\HeadToHeadSeeder as SeedersHeadToHeadSeeder;
use Illuminate\Database\Seeder;
use TeamFormSeeder;
// use HeadToHeadSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Create users
        // $users = User::insert([
        //     [
        //         'username' => 'kojo53i',
        //         'email' => 'admin@gmail.com',
        //         'password_hash' => bcrypt('admin123'),
        //         'role' => 'admin',
        //         'full_name' => 'Administrator'
        //     ],
        //     [
        //         'username' => 'user1',
        //         'email' => 'user1@example.com',
        //         'password_hash' => bcrypt('password123'),
        //         'role' => 'user',
        //         'full_name' => 'Test User 1'
        //     ]
        // ]);

        // Create projects
        // $projects = Project::create([
        //     [
        //         'name' => 'My Betting Project',
        //         'description' => 'First betting project',
        //         'user_id' => $users[0]->id,
        //         'bankroll' => 5000.00,
        //         'settings' => [
        //             'type' => 'normal',
        //             'risk_level' => 'medium'
        //         ]
        //     ],
        //     [
        //         'name' => 'High Risk Project',
        //         'description' => 'High risk betting strategy',
        //         'user_id' => $users[1]->id,
        //         'bankroll' => 1000.00,
        //         'settings' => [
        //             'type' => 'high-risk',
        //             'risk_level' => 'high'
        //         ]
        //     ]
        // ]);



        $this->call([
            TeamFormSeeder::class,
            HeadToHeadSeeder::class,
        ]);
        
            }
    }

