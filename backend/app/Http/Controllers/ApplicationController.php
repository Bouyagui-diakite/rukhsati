<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\LicenseType;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->roleEnum()->isStaff()
            ? Application::whereNot('status', ApplicationStatus::Draft->value)
            : $user->applications();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json(
            $query->with(['licenseType:id,code,name_fr,name_ar', 'user:id,name'])
                ->orderByDesc('created_at')
                ->paginate(15)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'license_type_id' => ['required', 'exists:license_types,id'],
            'form_data' => ['nullable', 'array'],
        ]);

        $type = LicenseType::findOrFail($data['license_type_id']);

        if (! $type->active) {
            throw ValidationException::withMessages([
                'license_type_id' => "Ce type d'agrément n'est plus disponible.",
            ]);
        }

        $application = $request->user()->applications()->create([
            'reference' => Application::nextReference(),
            'license_type_id' => $type->id,
            'status' => ApplicationStatus::Draft->value,
            'form_data' => $data['form_data'] ?? null,
        ]);

        return response()->json($application->load('licenseType.requiredDocuments'), 201);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('view', $application);

        return response()->json($application->load([
            'licenseType.requiredDocuments',
            'documents.requiredDocument',
            'events.user:id,name,role',
            'inspection',
            'license',
        ]));
    }

    public function update(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('update', $application);

        if ($application->statusEnum() !== ApplicationStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Seul un brouillon peut être modifié.',
            ]);
        }

        $data = $request->validate([
            'form_data' => ['required', 'array'],
        ]);

        $application->update(['form_data' => $data['form_data']]);

        return response()->json($application);
    }

    public function destroy(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('delete', $application);

        $application->delete();

        return response()->json(['message' => 'Brouillon supprimé.']);
    }

    public function submit(Request $request, Application $application, Workflow $workflow): JsonResponse
    {
        Gate::authorize('update', $application);

        $missing = $application->licenseType->requiredDocuments()
            ->where('mandatory', true)
            ->get()
            ->filter(function ($required) use ($application) {
                return ! $application->documents()
                    ->where('required_document_id', $required->id)
                    ->whereNot('status', ApplicationDocument::STATUS_REJECTED)
                    ->exists();
            });

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'documents' => 'Pièces obligatoires manquantes : '
                    .$missing->pluck('name_fr')->join(', '),
            ]);
        }

        $workflow->transition(
            $application,
            ApplicationStatus::Submitted,
            $request->user(),
            'Dossier soumis par l\'opérateur',
        );

        return response()->json($application->fresh()->load('events.user:id,name,role'));
    }

    public function resubmit(Request $request, Application $application, Workflow $workflow): JsonResponse
    {
        Gate::authorize('update', $application);

        $stillRejected = $application->documents()
            ->where('status', ApplicationDocument::STATUS_REJECTED)
            ->exists();

        if ($stillRejected) {
            throw ValidationException::withMessages([
                'documents' => 'Des pièces rejetées n\'ont pas encore été remplacées.',
            ]);
        }

        $workflow->transition(
            $application,
            ApplicationStatus::UnderReview,
            $request->user(),
            'Pièces corrigées, dossier resoumis par l\'opérateur',
        );

        return response()->json($application->fresh());
    }
}
