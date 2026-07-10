<?php

namespace App\Http\Controllers\BackOffice;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\LicenseIssuer;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class DecisionController extends Controller
{
    public function approve(
        Request $request,
        Application $application,
        Workflow $workflow,
        LicenseIssuer $issuer,
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
