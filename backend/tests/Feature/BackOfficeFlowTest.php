<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\LicenseType;
use App\Models\User;
use Database\Seeders\LicenseTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BackOfficeFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $operator;

    private User $officer;

    private User $inspector;

    private User $director;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LicenseTypeSeeder::class);
        Storage::fake('local');

        $this->operator = User::factory()->create(['role' => 'operator']);
        $this->officer = User::factory()->create(['role' => 'officer']);
        $this->inspector = User::factory()->create(['role' => 'inspector']);
        $this->director = User::factory()->create(['role' => 'director']);
    }

    private function submittedApplication(string $typeCode): Application
    {
        $type = LicenseType::where('code', $typeCode)->firstOrFail();

        $application = $this->operator->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Submitted->value,
        ]);

        foreach ($type->requiredDocuments as $required) {
            $application->documents()->create([
                'required_document_id' => $required->id,
                'path' => "applications/{$application->id}/fake.pdf",
                'original_name' => 'piece.pdf',
                'size_kb' => 100,
                'status' => ApplicationDocument::STATUS_PENDING,
            ]);
        }

        return $application;
    }

    private function approveAllDocuments(Application $application): void
    {
        Sanctum::actingAs($this->officer);
        foreach ($application->documents as $document) {
            $this->patchJson(
                "/api/applications/{$application->id}/documents/{$document->id}/review",
                ['status' => ApplicationDocument::STATUS_APPROVED],
            )->assertOk();
        }
    }

    public function test_full_cycle_without_inspection_until_license(): void
    {
        $application = $this->submittedApplication('travel_agency');

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();

        $this->approveAllDocuments($application);

        $this->postJson("/api/applications/{$application->id}/review/forward")->assertOk();
        $this->postJson("/api/applications/{$application->id}/review/to-decision")->assertOk();

        Sanctum::actingAs($this->director);
        $response = $this->postJson("/api/applications/{$application->id}/decision/approve")
            ->assertCreated();

        $this->assertSame(ApplicationStatus::Approved->value, $response->json('status'));
        $license = $response->json('license');
        $this->assertNotNull($license);
        $this->assertStringStartsWith('MCT-', $license['number']);

        $this->getJson("/api/verify/{$license['verification_token']}")
            ->assertOk()
            ->assertJsonPath('status', 'valid')
            ->assertJsonPath('number', $license['number']);

        $this->getJson('/api/verify/jeton-inexistant')->assertNotFound();

        $this->assertSame(4, $application->events()->count());
    }

    public function test_return_and_resubmit_cycle(): void
    {
        $application = $this->submittedApplication('travel_agency');

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();

        $document = $application->documents->first();
        $this->patchJson(
            "/api/applications/{$application->id}/documents/{$document->id}/review",
            ['status' => ApplicationDocument::STATUS_REJECTED, 'rejection_reason' => 'Document illisible'],
        )->assertOk();

        $this->postJson("/api/applications/{$application->id}/review/return", [
            'comment' => 'Le registre de commerce est illisible, merci de le resoummettre.',
        ])->assertOk();

        Sanctum::actingAs($this->operator);

        $this->postJson("/api/applications/{$application->id}/resubmit")
            ->assertUnprocessable();

        $this->postJson("/api/applications/{$application->id}/documents", [
            'required_document_id' => $document->required_document_id,
            'file' => UploadedFile::fake()->create('registre-corrige.pdf', 300, 'application/pdf'),
        ])->assertCreated();

        $this->postJson("/api/applications/{$application->id}/resubmit")->assertOk();

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => ApplicationStatus::UnderReview->value,
        ]);
    }

    public function test_hotel_flow_requires_inspection(): void
    {
        $application = $this->submittedApplication('hotel');

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();
        $this->approveAllDocuments($application);
        $this->postJson("/api/applications/{$application->id}/review/forward")->assertOk();

        $this->postJson("/api/applications/{$application->id}/review/to-decision")
            ->assertUnprocessable();

        $this->postJson("/api/applications/{$application->id}/inspection/schedule", [
            'inspector_id' => $this->inspector->id,
            'scheduled_for' => now()->addDays(3)->toDateString(),
        ])->assertOk();

        Sanctum::actingAs($this->inspector);
        $this->postJson("/api/applications/{$application->id}/inspection/report", [
            'conclusion' => 'favorable',
            'notes' => 'Établissement conforme aux normes de classement.',
        ])->assertOk();

        Sanctum::actingAs($this->director);
        $this->postJson("/api/applications/{$application->id}/decision/approve")->assertCreated();
    }

    public function test_inspectors_list_and_inspector_queue(): void
    {
        // La liste des inspecteurs est réservée au personnel.
        Sanctum::actingAs($this->operator);
        $this->getJson('/api/backoffice/inspectors')->assertForbidden();

        Sanctum::actingAs($this->officer);
        $this->getJson('/api/backoffice/inspectors')
            ->assertOk()
            ->assertJsonFragment(['id' => $this->inspector->id, 'name' => $this->inspector->name]);

        // Amène un dossier hôtelier jusqu'à l'inspection planifiée.
        $application = $this->submittedApplication('hotel');
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();
        $this->approveAllDocuments($application);
        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/forward")->assertOk();
        $this->postJson("/api/applications/{$application->id}/inspection/schedule", [
            'inspector_id' => $this->inspector->id,
            'scheduled_for' => now()->addDays(2)->toDateString(),
        ])->assertOk();

        // La file de l'inspecteur ne concerne que lui, et contient le dossier.
        Sanctum::actingAs($this->officer);
        $this->getJson('/api/inspector/inspections')->assertForbidden();

        Sanctum::actingAs($this->inspector);
        $this->getJson('/api/inspector/inspections')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $application->id);
    }

    public function test_scheduling_inspection_rolls_back_when_transition_is_invalid(): void
    {
        // Dossier hôtelier resté au stade "soumis" : la transition vers
        // Inspection n'est pas autorisée depuis ce statut, donc la
        // planification doit échouer sans laisser d'inspection en base.
        $application = $this->submittedApplication('hotel');

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/inspection/schedule", [
            'inspector_id' => $this->inspector->id,
            'scheduled_for' => now()->addDays(2)->toDateString(),
        ])->assertStatus(422);

        $this->assertDatabaseMissing('inspections', ['application_id' => $application->id]);
    }

    public function test_rejection_requires_comment_and_is_final(): void
    {
        $application = $this->submittedApplication('travel_agency');

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();
        $this->approveAllDocuments($application);
        $this->postJson("/api/applications/{$application->id}/review/forward")->assertOk();
        $this->postJson("/api/applications/{$application->id}/review/to-decision")->assertOk();

        Sanctum::actingAs($this->director);

        $this->postJson("/api/applications/{$application->id}/decision/reject")
            ->assertUnprocessable();

        $this->postJson("/api/applications/{$application->id}/decision/reject", [
            'comment' => 'Le local ne répond pas aux exigences réglementaires.',
        ])->assertOk();

        $this->postJson("/api/applications/{$application->id}/decision/approve")
            ->assertUnprocessable();
    }

    public function test_roles_are_enforced(): void
    {
        $application = $this->submittedApplication('travel_agency');

        Sanctum::actingAs($this->operator);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertForbidden();

        Sanctum::actingAs($this->officer);
        $this->postJson("/api/applications/{$application->id}/review/start")->assertOk();
        $this->approveAllDocuments($application);
        $this->postJson("/api/applications/{$application->id}/review/forward")->assertOk();
        $this->postJson("/api/applications/{$application->id}/review/to-decision")->assertOk();

        $this->postJson("/api/applications/{$application->id}/decision/approve")
            ->assertForbidden();

        Sanctum::actingAs($this->operator);
        $this->getJson('/api/backoffice/stats')->assertForbidden();

        Sanctum::actingAs($this->director);
        $this->getJson('/api/backoffice/stats')
            ->assertOk()
            ->assertJsonPath('pending_decision', 1);
    }
}
