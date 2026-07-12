<?php

/*
|--------------------------------------------------------------------------
| Configuration CORS
|--------------------------------------------------------------------------
|
| Origines autorisées à appeler l'API. En développement on autorise le serveur
| Vite ; en production, renseigner FRONTEND_URL (domaine du front) dans .env
| pour restreindre l'accès. Ne jamais laisser « * » avec des identifiants.
|
*/

$origins = array_filter([
    env('FRONTEND_URL'),
    env('APP_ENV') === 'production' ? null : 'http://localhost:5173',
    env('APP_ENV') === 'production' ? null : 'http://127.0.0.1:5173',
]);

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins ?: ['http://localhost:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
