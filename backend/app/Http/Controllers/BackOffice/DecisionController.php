<?php

namespace App\Http\Controllers\BackOffice;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\LicenseIssuer;
use App\Services\LicensePdf;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class DecisionController extends Controller
{
    public function approve(
        Request $request,
        Application $application,
        Workflow $workflow,
        LicenseIssuer $issuer,
        LicensePdf $licensePdf,
    ): JsonResponse {
        Gate::authorize('decide', $application);

        $data = $request->validate([
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $license = DB::transaction(function () use ($application, $workflow, $issuer, $request, $data) {
            $workflow->transition(
                $application,
                ApplicationStatus::Approved,
                $request->user(),
                $data['comment'] ?? 'Demande approuvée',
            );

            return $issuer->issue($application);
        });

        // Génération du certificat hors transaction : une écriture disque n'a
        // pas à rejouer avec un rollback SQL, et un échec de rendu ne doit pas
        // annuler une décision déjà prise. À défaut, le PDF est régénéré à la
        // volée au premier téléchargement.
        try {
            $licensePdf->store($license);
        } catch (\Throwable $e) {
            Log::error('Échec de génération du PDF d\'agrément', [
                'license_id' => $license->id,
                'exception' => $e->getMessage(),
            ]);
        }

        return response()->json($application->fresh()->load('license'), 201);
    }

    public function reject(
        Request $request,
        Application $application,
        Workflow $workflow,
    ): JsonResponse {
        Gate::authorize('decide', $application);

        $data = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $workflow->transition(
            $application,
            ApplicationStatus::Rejected,
            $request->user(),
            $data['comment'],
        );

        return response()->json($application->fresh());
    }
}
