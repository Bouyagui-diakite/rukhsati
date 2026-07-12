<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\LicenseType;
use App\Models\User;
use Database\Seeders\LicenseTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminLicenseTypeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LicenseTypeSeeder::class);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'code' => 'restaurant',
            'name_fr' => 'Licence de restaurant',
            'name_ar' => 'رخصة مطعم',
            'description_fr' => null,
            'description_ar' => null,
            'fee_mru' => 15000,
            'validity_months' => 24,
            'requires_inspection' => true,
            'review_deadline_days' => 12,
            'active' => true,
            'documents' => [
                ['name_fr' => 'Registre de commerce', 'name_ar' => 'السجل التجاري', 'mandatory' => true, 'accepted_formats' => 'pdf,jpg', 'max_size_kb' => 5120],
            ],
        ], $overrides);
    }

    public function test_only_admin_can_manage_license_types(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'operator']));
        $this->getJson('/api/admin/license-types')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'director']));
        $this->getJson('/api/admin/license-types')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/license-types')->assertOk();
    }

    public function test_admin_can_create_a_type_with_documents(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/admin/license-types', $this->payload())
            ->assertCreated()
            ->assertJsonPath('code', 'restaurant')
            ->assertJsonCount(1, 'required_documents');

        $this->assertDatabaseHas('license_types', ['code' => 'restaurant']);
        $this->assertDatabaseHas('required_documents', ['name_fr' => 'Registre de commerce']);
    }

    public function test_document_sync_adds_updates_and_removes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $type = LicenseType::where('code', 'travel_agency')->first();
        $existing = $type->requiredDocuments()->orderBy('sort_order')->first();

        // On garde le premier (renommé) et on ajoute un nouveau ; les autres partent.
        $this->putJson("/api/admin/license-types/{$type->id}", $this->payload([
            'code' => 'travel_agency',
            'name_fr' => $type->name_fr,
            'name_ar' => $type->name_ar,
            'documents' => [
                ['id' => $existing->id, 'name_fr' => 'RC (mis à jour)', 'name_ar' => 'السجل', 'mandatory' => true, 'accepted_formats' => 'pdf', 'max_size_kb' => 2048],
                ['name_fr' => 'Nouvelle pièce', 'name_ar' => 'وثيقة جديدة', 'mandatory' => false, 'accepted_formats' => 'pdf', 'max_size_kb' => 1024],
            ],
        ]))->assertOk()->assertJsonCount(2, 'required_documents');

        $this->assertDatabaseHas('required_documents', ['id' => $existing->id, 'name_fr' => 'RC (mis à jour)']);
        $this->assertDatabaseHas('required_documents', ['name_fr' => 'Nouvelle pièce']);
        $this->assertSame(2, $type->fresh()->requiredDocuments()->count());
    }

    public function test_type_in_use_cannot_be_deleted(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $type = LicenseType::where('code', 'travel_agency')->first();

        $operator = User::factory()->create(['role' => 'operator']);
        $operator->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Submitted->value,
        ]);

        $this->deleteJson("/api/admin/license-types/{$type->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');

        $this->assertDatabaseHas('license_types', ['id' => $type->id]);
    }

    public function test_unused_type_can_be_deleted(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $id = $this->postJson('/api/admin/license-types', $this->payload())->json('id');

        $this->deleteJson("/api/admin/license-types/{$id}")->assertOk();
        $this->assertDatabaseMissing('license_types', ['id' => $id]);
    }
}
