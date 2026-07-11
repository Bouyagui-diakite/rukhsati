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
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ApplicationController extends Controller
{
    /**
     * Schéma des champs du formulaire de demande (piloté par la config).
     */
    public function fields(): JsonResponse
    {
        return response()->json(config('rukhsati.application_fields'));
    }

    /**
     * Règles de validation dérivées du schéma pour form_data (partiel :
     * chaque champ fourni est validé, mais aucun n'est requis — la
     * complétude est exigée à la soumission).
     */
    private function formRules(): array
    {
        $rules = ['form_data' => ['required', 'array']];

        foreach (config('rukhsati.application_fields') as $field) {
            $rule = ['nullable'];

            if (($field['type'] ?? 'text') === 'select') {
                $rule[] = Rule::in(array_column($field['options'] ?? [], 'value'));
            } else {
                $rule[] = 'string';
                $rule[] = 'max:'.($field['max'] ?? 255);
                if (($field['type'] ?? '') === 'email') {
                    $rule[] = 'email';
                }
            }

            $rules['form_data.'.$field['key']] = $rule;
        }

        return $rules;
    }

    /**
     * Renseignements obligatoires manquants dans form_data (libellés FR).
     */
    private function missingFormFields(?array $data): \Illuminate\Support\Collection
    {
        $data ??= [];

        return collect(config('rukhsati.application_fields'))
            ->filter(fn ($f) => ($f['required'] ?? false) && blank($data[$f['key']] ?? null))
            ->pluck('label_fr')
            ->values();
    }
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

        if (! in_array($application->statusEnum(), [ApplicationStatus::Draft, ApplicationStatus::AwaitingDocuments], true)) {
            throw ValidationException::withMessages([
                'status' => 'Les renseignements ne sont modifiables que sur un brouillon ou un dossier renvoyé.',
            ]);
        }

        $data = $request->validate($this->formRules());

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

        $missingFields = $this->missingFormFields($application->form_data);
        if ($missingFields->isNotEmpty()) {
            throw ValidationException::withMessages([
                'form' => 'Renseignements obligatoires manquants : '.$missingFields->join(', '),
            ]);
        }

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
