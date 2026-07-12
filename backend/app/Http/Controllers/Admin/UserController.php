<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ApplicationEvent;
use App\Models\Inspection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Administration des comptes utilisateurs (personnel du ministère et
 * opérateurs) : création, rôles, mise à jour, suppression. Réservé au rôle
 * admin (middleware admin sur le groupe de routes).
 */
class UserController extends Controller
{
    private const ROLES = ['operator', 'officer', 'inspector', 'director', 'admin'];

    public function index(): JsonResponse
    {
        return response()->json(
            User::orderBy('name')->get(['id', 'name', 'email', 'phone', 'role', 'created_at'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(self::ROLES)],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create($data);

        return response()->json($user->only('id', 'name', 'email', 'phone', 'role'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(self::ROLES)],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        // Un admin ne peut pas se retirer à lui-même le rôle admin (il perdrait
        // l'accès et pourrait laisser le système sans administrateur).
        if ($user->id === $request->user()->id && $data['role'] !== UserRole::Admin->value) {
            throw ValidationException::withMessages([
                'role' => 'Vous ne pouvez pas modifier votre propre rôle.',
            ]);
        }

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->only('id', 'name', 'email', 'phone', 'role'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ]);
        }

        // On ne supprime pas un compte lié à l'historique : demandes déposées,
        // agréments délivrés, inspections menées ou événements journalisés.
        $linked = $user->applications()->exists()
            || $user->licenses()->exists()
            || Inspection::where('inspector_id', $user->id)->exists()
            || ApplicationEvent::where('user_id', $user->id)->exists();

        if ($linked) {
            throw ValidationException::withMessages([
                'user' => 'Cet utilisateur est lié à des dossiers ou des agréments et ne peut être supprimé.',
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
