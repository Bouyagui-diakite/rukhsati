<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LicenseType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Administration des types d'agrément et de leurs pièces requises. Réservé au
 * rôle admin (middleware admin sur le groupe de routes). Fidèle au principe
 * « configuration, pas code » : tout se gère ici, sans développement.
 */
class LicenseTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            LicenseType::withCount('applications')
                ->with('requiredDocuments')
                ->orderBy('name_fr')
                ->get()
        );
    }

    public function show(LicenseType $licenseType): JsonResponse
    {
        return response()->json($licenseType->load('requiredDocuments'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateType($request, null);

        $type = DB::transaction(function () use ($data) {
            $type = LicenseType::create(collect($data)->except('documents')->all());
            $this->syncDocuments($type, $data['documents'] ?? []);

            return $type;
        });

        return response()->json($type->load('requiredDocuments'), 201);
    }

    public function update(Request $request, LicenseType $licenseType): JsonResponse
    {
        $data = $this->validateType($request, $licenseType->id);

        DB::transaction(function () use ($licenseType, $data) {
            $licenseType->update(collect($data)->except('documents')->all());
            $this->syncDocuments($licenseType, $data['documents'] ?? []);
        });

        return response()->json($licenseType->fresh()->load('requiredDocuments'));
    }

    public function destroy(LicenseType $licenseType): JsonResponse
    {
        // Un type déjà utilisé par des demandes ne peut être supprimé : on le
        // désactive pour le retirer du catalogue sans casser l'historique.
        if ($licenseType->applications()->exists()) {
            throw ValidationException::withMessages([
                'type' => 'Ce type est utilisé par des demandes existantes. Désactivez-le plutôt que de le supprimer.',
            ]);
        }

        $licenseType->requiredDocuments()->delete();
        $licenseType->delete();

        return response()->json(['message' => "Type d'agrément supprimé."]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateType(Request $request, ?int $ignoreId): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:60', 'alpha_dash', Rule::unique('license_types', 'code')->ignore($ignoreId)],
            'name_fr' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'description_fr' => ['nullable', 'string', 'max:1000'],
            'description_ar' => ['nullable', 'string', 'max:1000'],
            'fee_mru' => ['required', 'integer', 'min:0'],
            'validity_months' => ['required', 'integer', 'min:1', 'max:600'],
            'requires_inspection' => ['required', 'boolean'],
            'review_deadline_days' => ['required', 'integer', 'min:1', 'max:365'],
            'active' => ['required', 'boolean'],

            'documents' => ['present', 'array'],
            'documents.*.id' => ['nullable', 'integer'],
            'documents.*.name_fr' => ['required', 'string', 'max:255'],
            'documents.*.name_ar' => ['required', 'string', 'max:255'],
            'documents.*.mandatory' => ['required', 'boolean'],
            'documents.*.accepted_formats' => ['required', 'string', 'max:100'],
            'documents.*.max_size_kb' => ['required', 'integer', 'min:1', 'max:51200'],
        ]);
    }

    /**
     * Remplace la liste des pièces requises par celle fournie (ordre = index).
     * Les pièces retirées et non liées à un document déposé sont supprimées.
     *
     * @param  array<int, array<string, mixed>>  $documents
     */
    private function syncDocuments(LicenseType $type, array $documents): void
    {
        $keptIds = [];

        foreach (array_values($documents) as $order => $doc) {
            $attributes = [
                'name_fr' => $doc['name_fr'],
                'name_ar' => $doc['name_ar'],
                'mandatory' => $doc['mandatory'],
                'accepted_formats' => Str::of($doc['accepted_formats'])->lower()->replace(' ', ''),
                'max_size_kb' => $doc['max_size_kb'],
                'sort_order' => $order,
            ];

            if (! empty($doc['id'])) {
                $type->requiredDocuments()->whereKey($doc['id'])->update($attributes);
                $keptIds[] = (int) $doc['id'];
            } else {
                $keptIds[] = $type->requiredDocuments()->create($attributes)->id;
            }
        }

        $type->requiredDocuments()->whereNotIn('id', $keptIds ?: [0])->delete();
    }
}
