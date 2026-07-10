# Rukhsati (رخصتي)

Plateforme de dématérialisation des agréments commerciaux et touristiques — Ministère du Commerce et du Tourisme, République Islamique de Mauritanie.

Un opérateur (agence de voyage, hôtelier, importateur) dépose sa demande d'agrément en ligne, suit son instruction en temps réel, et reçoit un agrément PDF muni d'un QR code vérifiable publiquement.

## Structure

- `backend/` — API Laravel : authentification (Sanctum), moteur de workflow (machine à états), instruction des dossiers, génération PDF + QR, notifications.
- `frontend/` — React (Vite) : portail opérateur (mobile-first), back-office ministère, espace public de vérification. Bilingue français/arabe (RTL).

## Types d'agréments couverts par la V1

1. Licence d'agence de voyage
2. Autorisation d'exploitation hôtelière (avec inspection sur site)
3. Agrément d'importation et distribution

Les types d'agréments et leurs pièces exigées sont configurables en base (`license_types`, `required_documents`) — ajouter un type ne demande aucun développement.

## Démarrage

```bash
# Backend
cd backend
composer install
php artisan migrate --seed
php artisan serve

# Frontend
cd frontend
npm install
npm run dev
```

## Feuille de route (post-V1)

- Paiement en ligne (Bankily / Masrvi / Sedad)
- Intégration Khidmaty (porte d'entrée) et Houwiyeti (identité)
- Module inspecteur mobile hors-ligne
