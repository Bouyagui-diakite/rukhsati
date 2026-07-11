<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\LicenseType;
use App\Models\User;
use Database\Seeders\LicenseTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LicenseTypeSeeder::class);
        Storage::fake('local');
    }

    public function test_operator_can_register_and_login(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Bouyagui Diakite',
            'email' => 'bouya@example.mr',
            'phone' => '22212345678',
            'password' => 'motdepasse',
            'password_confirmation' => 'motdepasse',
        ])->assertCreated()->assertJsonStructure(['user', 'token']);

        $this->postJson('/api/auth/login', [
            'email' => 'bouya@example.mr',
            'password' => 'motdepasse',
        ])->assertOk()->assertJsonStructure(['user', 'token']);

        $this->postJson('/api/auth/login', [
            'email' => 'bouya@example.mr',
            'password' => 'mauvais',
        ])->assertUnprocessable();
    }

    public function test_full_application_flow_until_submission(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        Sanctum::actingAs($operator);

        $type = LicenseType::where('code', 'travel_agency')->first();

        $response = $this->postJson('/api/applications', [
            'license_type_id' => $type->id,
        ])->assertCreated();

        $applicationId = $response->json('id');
        $this->assertSame(ApplicationStatus::Draft->value, $response->json('status'));
        $this->assertStringStartsWith('AGR-', $response->json('reference'));

        // Soumettre sans renseignements ni pièces est refusé.
        $this->postJson("/api/applications/{$applicationId}/submit")
            ->assertUnprocessable();

        // Renseignements obligatoires du formulaire (schéma piloté par la config).
        $this->patchJson("/api/applications/{$applicationId}", [
            'form_data' => [
                'company_name' => 'Sahara Tours SARL',
                'legal_form' => 'sarl',
                'rc_number' => '45812',
                'nif' => 'NIF-99001',
                'manager_name' => 'Mohamed Ould Ahmed',
                'phone' => '22233445',
                'wilaya' => 'nkc_ouest',
                'address' => 'Tevragh Zeina, Nouakchott',
            ],
        ])->assertOk();

        // Renseignements complets mais pièces manquantes : toujours refusé.
        $this->postJson("/api/applications/{$applicationId}/submit")
            ->assertUnprocessable();

        foreach ($type->requiredDocuments()->where('mandatory', true)->get() as $required) {
            $this->postJson("/api/applications/{$applicationId}/documents", [
                'required_document_id' => $required->id,
                'file' => UploadedFile::fake()->create('piece.pdf', 500, 'application/pdf'),
            ])->assertCreated();
        }

        $this->postJson("/api/applications/{$applicationId}/submit")->assertOk();

        $this->assertDatabaseHas('applications', [
            'id' => $applicationId,
            'status' => ApplicationStatus::Submitted->value,
        ]);
        $this->assertDatabaseHas('application_events', [
            'application_id' => $applicationId,
            'from_status' => ApplicationStatus::Draft->value,
            'to_status' => ApplicationStatus::Submitted->value,
        ]);

        $this->postJson("/api/applications/{$applicationId}/submit")
            ->assertUnprocessable();
    }

    public function test_application_fields_schema_is_exposed(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'operator']));

        $this->getJson('/api/application-fields')
            ->assertOk()
            ->assertJsonFragment(['key' => 'company_name'])
            ->assertJsonFragment(['key' => 'wilaya']);
    }

    public function test_form_data_is_validated_against_the_schema(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        Sanctum::actingAs($operator);
        $type = LicenseType::where('code', 'travel_agency')->first();

        $id = $this->postJson('/api/applications', ['license_type_id' => $type->id])->json('id');

        // Une option de select hors liste est rejetée.
        $this->patchJson("/api/applications/{$id}", [
            'form_data' => ['company_name' => 'X SARL', 'wilaya' => 'atlantis'],
        ])->assertUnprocessable()->assertJsonValidationErrors('form_data.wilaya');

        // Un e-mail invalide est rejeté.
        $this->patchJson("/api/applications/{$id}", [
            'form_data' => ['email' => 'pas-un-email'],
        ])->assertUnprocessable()->assertJsonValidationErrors('form_data.email');

        // Des valeurs valides sont acceptées.
        $this->patchJson("/api/applications/{$id}", [
            'form_data' => ['company_name' => 'X SARL', 'wilaya' => 'adrar', 'email' => 'contact@x.mr'],
        ])->assertOk();
    }

    public function test_operator_cannot_access_someone_elses_application(): void
    {
        $owner = User::factory()->create(['role' => 'operator']);
        $intruder = User::factory()->create(['role' => 'operator']);
        $type = LicenseType::first();

        $application = $owner->applications()->create([
            'reference' => 'AGR-2026-9999',
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Draft->value,
        ]);

        Sanctum::actingAs($intruder);

        $this->getJson("/api/applications/{$application->id}")->assertForbidden();
        $this->patchJson("/api/applications/{$application->id}", [
            'form_data' => ['pirate' => true],
        ])->assertForbidden();
    }

    public function test_staff_can_see_submitted_applications_but_not_drafts(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $officer = User::factory()->create(['role' => 'officer']);
        $type = LicenseType::first();

        $operator->applications()->create([
            'reference' => 'AGR-2026-0201',
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Draft->value,
        ]);
        $operator->applications()->create([
            'reference' => 'AGR-2026-0202',
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Submitted->value,
        ]);

        Sanctum::actingAs($officer);

        $response = $this->getJson('/api/applications')->assertOk();
        $references = collect($response->json('data'))->pluck('reference');

        $this->assertTrue($references->contains('AGR-2026-0202'));
        $this->assertFalse($references->contains('AGR-2026-0201'));
    }

    public function test_document_upload_rejects_wrong_format(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        Sanctum::actingAs($operator);

        $type = LicenseType::where('code', 'travel_agency')->first();
        $required = $type->requiredDocuments()->first();

        $application = $operator->applications()->create([
            'reference' => 'AGR-2026-0300',
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Draft->value,
        ]);

        $this->postJson("/api/applications/{$application->id}/documents", [
            'required_document_id' => $required->id,
            'file' => UploadedFile::fake()->create('virus.exe', 100, 'application/octet-stream'),
        ])->assertUnprocessable();
    }
}
