<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Applique la langue de l'utilisateur aux réponses de l'API (messages de
 * validation notamment). Le front envoie sa langue courante via l'en-tête
 * X-Locale (voir frontend/src/api.js) ; à défaut on lit Accept-Language.
 * Seules les langues prises en charge sont acceptées, sinon on garde le
 * défaut (français).
 */
class SetLocale
{
    private const SUPPORTED = ['fr', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('X-Locale')
            ?: substr((string) $request->header('Accept-Language'), 0, 2);

        if (in_array($locale, self::SUPPORTED, true)) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
