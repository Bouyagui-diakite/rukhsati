<?php

namespace App\Http\Controllers\BackOffice;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Inspection;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InspectionController extends Controller
{
    public function submitReport(
        Request $request,
        Application $application,
        Workflow $workflow,
    ): JsonResponse {
        Gate::authorize('inspect', $application);

        $inspection = $application->inspection;

        if (! $inspection) {
            throw ValidationException::withMessages([
                'inspection' => 'Aucune inspection planifiée pour ce dossier.',
            ]);
        }

        $user = $request->user();
        if ($user->role === 'inspector' && $inspection->inspector_id !== $user->id) {
            abort(403, 'Cette inspection est assignée à un autre inspecteur.');
        }

        $data = $request->validate([
            'conclusion' => ['required', Rule::in([
                Inspection::CONCLUSION_FAVORABLE,
                Inspection::CONCLUSION_UNFAVORABLE,
                Inspection::CONCLUSION_RESERVED,
            ])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'report' => ['nullable', 'array'],
        ]);

        $inspection->update($data + ['conducted_at' => now()]);

        $workflow->transition(
            $application,
            ApplicationStatus::AwaitingDecision,
            $user,
            "Rapport d'inspection : {$data['conclusion']}",
        );

        return response()->json($application->fresh()->load('inspection'));
    }
}
