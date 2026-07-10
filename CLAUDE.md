# Rukhsati (رخصتي)

Plateforme de dématérialisation des agréments commerciaux et touristiques pour le Ministère du Commerce et du Tourisme (Mauritanie). Initiative personnelle de Bouyagui Diakite, destinée à être pitchée au ministère. Le nom suit la convention des plateformes nationales (Khidmaty, Houwiyeti). Vérifié : Khidmaty ne couvre que l'agrément au Code des Investissements (APIM) — les agréments sectoriels commerce/tourisme sont le terrain libre de ce projet.

## Architecture

- `backend/` — API Laravel 12 (PHP 8.2 via XAMPP, SQLite en dev), auth par tokens Sanctum.
- `frontend/` — React (Vite) + Tailwind v4 + react-router + axios + i18next. Proxy `/api` → `http://localhost:8000` (voir `vite.config.js`).
- Bilingue FR/AR obligatoire partout : `frontend/src/i18n.js` gère la bascule et le RTL (`setLanguage()`). Toute nouvelle chaîne UI passe par i18next, jamais en dur.

## Concepts clés du backend

- **Machine à états** : le statut d'un dossier ne se modifie JAMAIS directement. Toujours passer par `App\Services\Workflow::transition()`, qui valide la transition (`App\Enums\ApplicationStatus::allowedTransitions()`) et journalise dans `application_events` (table d'audit en écriture seule, sans `updated_at`). Une transition interdite lève `DomainException`, rendue en 422 (voir `bootstrap/app.php`).
- **Configuration, pas code** : les types d'agréments et leurs pièces exigées vivent en base (`license_types`, `required_documents` — formats acceptés, taille max, obligatoire ou non). Ajouter un type d'agrément ne doit demander AUCUN développement.
- **Demande ≠ agrément** : `applications` (la demande, cycle draft→…→approved/rejected) et `licenses` (l'agrément délivré : numéro `MCT-YYYY-NNNN`, `verification_token` UUID pour le QR, statuts valid/suspended/expired/revoked). Délivrance via `App\Services\LicenseIssuer` (appelé par `DecisionController::approve`).
- **Rôles** (`users.role`, enum `App\Enums\UserRole`) : operator, officer (guichet), inspector, director, admin. Autorisations dans `App\Policies\ApplicationPolicy` (view/update/delete/review/inspect/decide).
- Parcours complet : dépôt opérateur (wizard) → vérification pièce par pièce au guichet (renvoi possible → resoumission) → instruction technique → inspection sur site (obligatoire si `requires_inspection`, ex. hôtels) → décision directeur → licence + vérification publique `GET /api/verify/{token}` (sans auth, c'est l'endpoint du QR code).

## Commandes

```bash
# Backend (depuis backend/)
php artisan serve          # http://localhost:8000
php artisan test           # 12 tests / 86 assertions — DOIVENT rester verts
php artisan migrate:fresh --seed   # reset + 3 types d'agréments + comptes démo

# Frontend (depuis frontend/)
npm run dev                # http://localhost:5173
```

Comptes démo (mot de passe `password`) : operateur@demo.mr, guichet@demo.mr, inspecteur@demo.mr, directeur@demo.mr, admin@demo.mr.

## État d'avancement (10 juil. 2026)

Fait — backend fonctionnellement complet et testé :
- Auth (register/login/me/logout), catalogue `GET /api/license-types`
- CRUD demandes opérateur + upload de pièces (validé par la config) + submit/resubmit
- Back-office complet : review/start, contrôle des pièces, return, forward, inspection (schedule + report), décision (approve → licence, reject), stats `GET /api/backoffice/stats`
- Vérification publique par jeton
- Frontend : socle seulement (landing bilingue RTL, routes placeholder)

À faire (dans l'ordre prévu) :
1. PDF de l'agrément avec QR code (dompdf + endroid/qr-code, à brancher dans `LicenseIssuer` ; le jeton et l'endpoint existent déjà)
2. Écrans React opérateur : wizard de demande en 4 étapes (maquettes validées : liste dossiers avec badges de statut, wizard documents, suivi)
3. Écrans back-office : file d'instruction triée du plus ancien, écran d'instruction pièce par pièce, dashboard directeur, page publique de vérification
4. Notifications (mail + passerelle SMS locale type Chinguisoft, via queue)
5. Feuille de route pitch : paiement Bankily/Masrvi, intégration Khidmaty/Houwiyeti

## Conventions

- Tests obligatoires pour tout nouvel endpoint (suivre le style de `tests/Feature/*FlowTest.php`)
- Messages/commentaires d'événements en français
- Ne jamais exposer les fichiers uploadés en direct : ils sont hors racine web, servis via la route de download authentifiée
