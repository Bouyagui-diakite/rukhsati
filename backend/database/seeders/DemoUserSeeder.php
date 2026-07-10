<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Opérateur démo', 'email' => 'operateur@demo.mr', 'role' => UserRole::Operator],
            ['name' => 'Agent de guichet', 'email' => 'guichet@demo.mr', 'role' => UserRole::Officer],
            ['name' => 'Inspecteur', 'email' => 'inspecteur@demo.mr', 'role' => UserRole::Inspector],
            ['name' => 'Directeur', 'email' => 'directeur@demo.mr', 'role' => UserRole::Director],
            ['name' => 'Administrateur', 'email' => 'admin@demo.mr', 'role' => UserRole::Admin],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'role' => $data['role']->value,
                    'password' => 'password',
                ],
            );
        }
    }
}
