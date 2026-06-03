<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'durancristian31306@gmail.com'],
            [
                'name' => 'Cristian',
                'password' => Hash::make('Cristian_5732988$'),
                'role' => 'superadmin',
                'tenant_id' => null
            ]
        );
    }
}
