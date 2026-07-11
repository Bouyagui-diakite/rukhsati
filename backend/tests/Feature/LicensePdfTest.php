<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\License;
use App\Models\LicenseType;
use App\Models\User;
use App\Services\LicensePdf;
use Database\Seeders\LicenseTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LicensePdfTest extends TestCase
{
    use RefreshDatabase;

    private User $operator;

    private User $director;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LicenseTypeSeeder::class);
        Storage::fake('local');

        $this->operator = User::factory()->create(['role' => 'operator']);
        $this->director = User::factory()->create(['role' => 'director']);
    }

    /**
     * Amène un dossier jusqu'à l'agrément délivré et renvoie la License.
     */
    private function issuedLicense(): License
    {
        $type = LicenseType::where('code', 'travel_agency')->firstOrFail();

        $application = $this->operator->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::AwaitingDecision->value,
        ]);

        Sanctum::actingAs($this->director);
        $this->postJson("/api/applications/{$application->id}/decision/approve")
            ->assertCreated();

        return $application->refresh()->license;
    }

    public function test_pdf_is_generated_and_stored_on_approval(): void
    {
        $license = $this->issuedLicense();

        $this->assertNotNull($license->pdf_path);
        Storage::disk('local')->assertExists($license->pdf_path);

        $bytes = Storage::disk('local')->get($license->pdf_path);
        $this->assertStringStartsWith('%PDF-', $bytes);
    }

    public function test_owner_can_download_the_certificate(): void
    {
        $license = $this->issuedLicense();

        Sanctum::actingAs($this->operator);
        $response = $this->get("/api/applications/{$license->application_id}/license/pdf");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->streamedContent());
    }

    public function test_staff_can_download_the_certificate(): void
    {
        $license = $this->issuedLicense();

        Sanctum::actingAs($this->director);
        $this->get("/api/applications/{$license->application_id}/license/pdf")
            ->assertOk();
    }

    public function test_unrelated_operator_cannot_download(): void
    {
        $license = $this->issuedLicense();
        $stranger = User::factory()->create(['role' => 'operator']);

        Sanctum::actingAs($stranger);
        $this->get("/api/applications/{$license->application_id}/license/pdf")
            ->assertForbidden();
    }

    public function test_download_regenerates_when_file_is_missing(): void
    {
        $license = $this->issuedLicense();

        // Simule un PDF jamais généré (ex. échec best-effort à l'approbation).
        Storage::disk('local')->delete($license->pdf_path);
        $license->forceFill(['pdf_path' => null])->save();

        Sanctum::actingAs($this->operator);
        $this->get("/api/applications/{$license->application_id}/license/pdf")
            ->assertOk();

        Storage::disk('local')->assertExists($license->fresh()->pdf_path);
    }

    public function test_download_404_when_no_license_issued(): void
    {
        $type = LicenseType::where('code', 'travel_agency')->firstOrFail();
        $application = $this->operator->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::UnderReview->value,
        ]);

        Sanctum::actingAs($this->operator);
        $this->get("/api/applications/{$application->id}/license/pdf")
            ->assertNotFound();
    }

    public function test_qr_code_encodes_the_public_verification_url(): void
    {
        $license = $this->issuedLicense();
        $svc = app(LicensePdf::class);

        $this->assertSame(
            config('rukhsati.verify_url').'/'.$license->verification_token,
            $svc->verificationUrl($license),
        );

        $qr = $svc->qrCode('https://example.test/verify/abc');
        $this->assertStringStartsWith('data:image/svg+xml;base64,', $qr);
    }
}
