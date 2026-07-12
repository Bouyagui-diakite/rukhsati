<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Réserve une route au rôle administrateur (gestion des types d'agrément,
 * pièces requises, utilisateurs…).
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->roleEnum() === UserRole::Admin, 403);

        return $next($request);
    }
}
