<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\LicenseType;
use App\Models\User;
use Database\Seeders\LicenseTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_manage_users(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'director']));
        $this->getJson('/api/admin/users')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/users')->assertOk();
    }

    public function test_admin_can_create_a_staff_user(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/admin/users', [
            'name' => 'Nouvel Agent',
            'email' => 'agent@demo.mr',
            'phone' => '22200000',
            'role' => 'officer',
            'password' => 'motdepasse12',
        ])->assertCreated()->assertJsonPath('role', 'officer');

        $this->assertDatabaseHas('users', ['email' => 'agent@demo.mr', 'role' => 'officer']);
        $user = User::where('email', 'agent@demo.mr')->first();
        $this->assertTrue(Hash::check('motdepasse12', $user->password));
    }

    public function test_password_is_optional_on_update(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);
        $user = User::factory()->create(['role' => 'officer', 'password' => 'ancienmotdepasse']);

        // Mise à jour sans mot de passe : l'ancien est conservé, le rôle change.
        $this->putJson("/api/admin/users/{$user->id}", [
            'name' => 'Agent Modifié',
            'email' => $user->email,
            'role' => 'inspector',
        ])->assertOk()->assertJsonPath('role', 'inspector');

        $this->assertTrue(Hash::check('ancienmotdepasse', $user->fresh()->password));
    }

    public function test_admin_cannot_delete_or_demote_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$admin->id}")
            ->assertStatus(422)->assertJsonValidationErrors('user');

        $this->putJson("/api/admin/users/{$admin->id}", [
            'name' => $admin->name, 'email' => $admin->email, 'role' => 'operator',
        ])->assertStatus(422)->assertJsonValidationErrors('role');
    }

    public function test_user_linked_to_data_cannot_be_deleted(): void
    {
        $this->seed(LicenseTypeSeeder::class);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $operator = User::factory()->create(['role' => 'operator']);
        $operator->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => LicenseType::first()->id,
            'status' => ApplicationStatus::Draft->value,
        ]);

        $this->deleteJson("/api/admin/users/{$operator->id}")
            ->assertStatus(422)->assertJsonValidationErrors('user');
        $this->assertDatabaseHas('users', ['id' => $operator->id]);
    }

    public function test_admin_can_delete_unlinked_user(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $user = User::factory()->create(['role' => 'officer']);

        $this->deleteJson("/api/admin/users/{$user->id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
