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

    /*
    |--------------------------------------------------------------------------
    | Champs du formulaire de demande
    |--------------------------------------------------------------------------
    |
    | Renseignements collectés pour toute demande d'agrément, communs à tous les
    | types. Pilotés par la configuration : le formulaire front est rendu à
    | partir de cette liste et la validation API en découle. Ajouter un champ ne
    | demande aucun développement.
    |
    | type : text | tel | email | textarea | select
    | Les options d'un select sont bilingues (value, fr, ar).
    |
    */

    'application_fields' => [
        ['key' => 'company_name', 'type' => 'text', 'required' => true, 'max' => 255,
            'label_fr' => 'Raison sociale', 'label_ar' => 'الاسم التجاري'],

        ['key' => 'legal_form', 'type' => 'select', 'required' => true,
            'label_fr' => 'Forme juridique', 'label_ar' => 'الشكل القانوني',
            'options' => [
                ['value' => 'sarl', 'fr' => 'SARL', 'ar' => 'ش.ذ.م.م'],
                ['value' => 'sa', 'fr' => 'SA', 'ar' => 'ش.م'],
                ['value' => 'suarl', 'fr' => 'SUARL', 'ar' => 'ش.ذ.م.م.و'],
                ['value' => 'individual', 'fr' => 'Entreprise individuelle', 'ar' => 'مؤسسة فردية'],
                ['value' => 'cooperative', 'fr' => 'Coopérative', 'ar' => 'تعاونية'],
            ]],

        ['key' => 'rc_number', 'type' => 'text', 'required' => true, 'max' => 60,
            'label_fr' => 'Numéro du registre de commerce', 'label_ar' => 'رقم السجل التجاري'],

        ['key' => 'nif', 'type' => 'text', 'required' => true, 'max' => 60,
            'label_fr' => "Numéro d'identification fiscale (NIF)", 'label_ar' => 'رقم التعريف الجبائي'],

        ['key' => 'manager_name', 'type' => 'text', 'required' => true, 'max' => 255,
            'label_fr' => 'Nom du gérant', 'label_ar' => 'اسم المسير'],

        ['key' => 'phone', 'type' => 'tel', 'required' => true, 'max' => 30,
            'label_fr' => 'Téléphone', 'label_ar' => 'الهاتف'],

        ['key' => 'email', 'type' => 'email', 'required' => false, 'max' => 255,
            'label_fr' => 'Adresse e-mail', 'label_ar' => 'البريد الإلكتروني'],

        ['key' => 'wilaya', 'type' => 'select', 'required' => true,
            'label_fr' => 'Wilaya', 'label_ar' => 'الولاية',
            'options' => [
                ['value' => 'hodh_chargui', 'fr' => 'Hodh Ech Chargui', 'ar' => 'الحوض الشرقي'],
                ['value' => 'hodh_gharbi', 'fr' => 'Hodh El Gharbi', 'ar' => 'الحوض الغربي'],
                ['value' => 'assaba', 'fr' => 'Assaba', 'ar' => 'العصابة'],
                ['value' => 'gorgol', 'fr' => 'Gorgol', 'ar' => 'كوركول'],
                ['value' => 'brakna', 'fr' => 'Brakna', 'ar' => 'لبراكنة'],
                ['value' => 'trarza', 'fr' => 'Trarza', 'ar' => 'الترارزة'],
                ['value' => 'adrar', 'fr' => 'Adrar', 'ar' => 'آدرار'],
                ['value' => 'nouadhibou', 'fr' => 'Dakhlet Nouadhibou', 'ar' => 'داخلت نواذيبو'],
                ['value' => 'tagant', 'fr' => 'Tagant', 'ar' => 'تكانت'],
                ['value' => 'guidimaka', 'fr' => 'Guidimaka', 'ar' => 'كيديماغا'],
                ['value' => 'tiris_zemmour', 'fr' => 'Tiris Zemmour', 'ar' => 'تيرس زمور'],
                ['value' => 'inchiri', 'fr' => 'Inchiri', 'ar' => 'إنشيري'],
                ['value' => 'nkc_ouest', 'fr' => 'Nouakchott-Ouest', 'ar' => 'نواكشوط الغربية'],
                ['value' => 'nkc_nord', 'fr' => 'Nouakchott-Nord', 'ar' => 'نواكشوط الشمالية'],
                ['value' => 'nkc_sud', 'fr' => 'Nouakchott-Sud', 'ar' => 'نواكشوط الجنوبية'],
            ]],

        ['key' => 'address', 'type' => 'textarea', 'required' => true, 'max' => 500,
            'label_fr' => 'Siège social (adresse)', 'label_ar' => 'المقر الاجتماعي (العنوان)'],

        ['key' => 'activity', 'type' => 'textarea', 'required' => false, 'max' => 1000,
            'label_fr' => "Description de l'activité", 'label_ar' => 'وصف النشاط'],
    ],

];
