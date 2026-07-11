<?php

return [

    /*
    |--------------------------------------------------------------------------
    | URL de vérification publique
    |--------------------------------------------------------------------------
    |
    | Adresse ouverte lorsqu'on scanne le QR code d'un agrément. Le jeton de
    | vérification de l'agrément est ajouté à la fin (…/verifier/{token}).
    | Doit pointer vers la page publique du front (route /verifier), pas
    | l'API JSON.
    |
    */

    'verify_url' => rtrim(env('LICENSE_VERIFY_URL', env('APP_URL').'/verifier'), '/'),

    /*
    |--------------------------------------------------------------------------
    | Disque de stockage des PDF d'agrément
    |--------------------------------------------------------------------------
    |
    | Les certificats générés sont des documents officiels : par défaut on les
    | garde sur le disque privé « local », servis uniquement via l'API après
    | contrôle d'autorisation.
    |
    */

    'license_disk' => env('LICENSE_DISK', 'local'),

];
