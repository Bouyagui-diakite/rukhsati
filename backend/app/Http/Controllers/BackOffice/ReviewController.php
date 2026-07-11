<?php

namespace App\Http\Controllers\BackOffice;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\User;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function __construct(private readonly Workflow $workflow) {}

    public function start(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('review', $application);

        $this->workflow->transition(
            $application,
            ApplicationStatus::UnderReview,
            $request->user(),
            'Vérification démarrée',
        );

        return response()->json($application->fresh());
    }

    public function reviewDocument(
        Request $request,
        Application $application,
        ApplicationDocument $document,
    ): JsonResponse {
        Gate::authorize('review', $application);

        abort_unless($document->application_id === $application->id, 404);

        if ($application->statusEnum() !== ApplicationStatus::UnderReview) {
            throw ValidationException::withMessages([
                'status' => "Les pièces ne peuvent être contrôlées qu'en cours de vérification.",
            ]);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in([
                ApplicationDocument::STATUS_APPROVED,
                ApplicationDocument::STATUS_REJECTED,
            ])],
            'rejection_reason' => [
                'required_if:status,'.ApplicationDocument::STATUS_REJECTED,
                'nullable',
                'string',
                'max:500',
            ],
        ]);

        $document->update([
            'status' => $data['status'],
            'rejection_reason' => $data['status'] === ApplicationDocument::STATUS_REJECTED
                ? $data['rejection_reason']
                : null,
        ]);

        return response()->json($document->load('requiredDocument'));
    }

    public function returnToOperator(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('review', $application);

        $data = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $this->workflow->transition(
            $application,
            ApplicationStatus::AwaitingDocuments,
            $request->user(),
            $data['comment'],
        );

        return response()->json($application->fresh());
    }

    public function forwardToTechnical(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('review', $application);

        $notApproved = $application->licenseType->requiredDocuments()
            ->where('mandatory', true)
            ->get()
            ->filter(function ($required) use ($application) {
                return ! $application->documents()
                    ->where('required_document_id', $required->id)
                    ->where('status', ApplicationDocument::STATUS_APPROVED)
                    ->exists();
            });

        if ($notApproved->isNotEmpty()) {
            throw ValidationException::withMessages([
                'documents' => 'Pièces obligatoires non validées : '
                    .$notApproved->pluck('name_fr')->join(', '),
            ]);
        }

        $this->workflow->transition(
            $application,
            ApplicationStatus::TechnicalReview,
            $request->user(),
            'Dossier transmis à l\'instruction technique',
        );

        return response()->json($application->fresh());
    }

    public function scheduleInspection(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('review', $application);

        if (! $application->licenseType->requires_inspection) {
            throw ValidationException::withMessages([
                'inspection' => "Ce type d'agrément ne requiert pas d'inspection.",
            ]);
        }

        $data = $request->validate([
            'inspector_id' => ['required', 'exists:users,id'],
            'scheduled_for' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $inspector = User::findOrFail($data['inspector_id']);
        if ($inspector->role !== 'inspector') {
            throw ValidationException::withMessages([
                'inspector_id' => "Cet utilisateur n'est pas inspecteur.",
            ]);
        }

        // Création de l'inspection et transition dans la même transaction :
        // si la transition est refusée (statut de départ invalide), on ne
        // laisse pas d'inspection orpheline en base.
        DB::transaction(function () use ($application, $inspector, $data, $request) {
            $application->inspection()->create([
                'inspector_id' => $inspector->id,
                'scheduled_for' => $data['scheduled_for'],
            ]);

            $this->workflow->transition(
                $application,
                ApplicationStatus::Inspection,
                $request->user(),
                "Inspection planifiée le {$data['scheduled_for']} ({$inspector->name})",
            );
        });

        return response()->json($application->fresh()->load('inspection'));
    }

    public function toDecision(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('review', $application);

        if ($application->licenseType->requires_inspection) {
            throw ValidationException::withMessages([
                'inspection' => "Ce type d'agrément requiert une inspection avant décision.",
            ]);
        }

        $this->workflow->transition(
            $application,
            ApplicationStatus::AwaitingDecision,
            $request->user(),
            'Instruction terminée, transmis pour décision',
        );

        return response()->json($application->fresh());
    }
}
