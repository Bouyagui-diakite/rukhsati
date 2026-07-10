<?php

namespace App\Http\Controllers;

use App\Models\License;
use Illuminate\Http\JsonResponse;

class VerificationController extends Controller
{
    /**
     * Vérification publique d'un agrément via le jeton du QR code.
     * Aucune authentification : c'est la page que voit un policier,
     * un client ou une banque qui scanne le document.
     */
    public function show(string $token): JsonResponse
    {
        $license = License::where('verification_token', $token)
            ->with(['licenseType:id,name_fr,name_ar', 'user:id,name'])
            ->firstOrFail();

        $status = $license->statusEnum();

        return response()->json([
            'number' => $license->number,
            'operator' => $license->user->name,
            'type_fr' => $license->licenseType->name_fr,
            'type_ar' => $license->licenseType->name_ar,
            'issued_at' => $license->issued_at->toDateString(),
            'expires_at' => $license->expires_at->toDateString(),
            'status' => $status->value,
            'status_label' => $status->labelFr(),
            'verified_at' => now()->toIso8601String(),
        ]);
    }
}
