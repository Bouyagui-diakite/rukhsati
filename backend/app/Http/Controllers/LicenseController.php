<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Services\LicensePdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LicenseController extends Controller
{
    /**
     * Télécharge le certificat d'agrément (PDF) d'un dossier approuvé.
     * Accessible au titulaire du dossier comme au personnel (Gate « view »).
     * Le PDF est l'artefact officiel figé à l'émission ; le statut vivant
     * s'obtient en scannant le QR (voir VerificationController).
     */
    public function download(Request $request, Application $application, LicensePdf $pdf): StreamedResponse
    {
        Gate::authorize('view', $application);

        $license = $application->license;

        abort_if($license === null, 404, "Aucun agrément n'a été délivré pour ce dossier.");

        $disk = config('rukhsati.license_disk', 'local');

        if (! $license->pdf_path || ! Storage::disk($disk)->exists($license->pdf_path)) {
            $pdf->store($license);
            $license->refresh();
        }

        return Storage::disk($disk)->download(
            $license->pdf_path,
            "agrement-{$license->number}.pdf",
            ['Content-Type' => 'application/pdf'],
        );
    }
}
