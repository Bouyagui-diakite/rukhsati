<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApplicationDocumentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackOffice\DecisionController;
use App\Http\Controllers\BackOffice\InspectionController;
use App\Http\Controllers\BackOffice\ReviewController;
use App\Http\Controllers\Admin\LicenseTypeController as AdminLicenseTypeController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\BackOffice\StatsController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\LicenseTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/license-types', [LicenseTypeController::class, 'index']);
Route::get('/verify/{token}', [VerificationController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Notifications in-app
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Parcours opérateur
    Route::get('/application-fields', [ApplicationController::class, 'fields']);
    Route::apiResource('applications', ApplicationController::class)
        ->except('update')
        ->whereNumber('application');
    Route::patch('/applications/{application}', [ApplicationController::class, 'update'])
        ->whereNumber('application');
    Route::post('/applications/{application}/submit', [ApplicationController::class, 'submit'])
        ->whereNumber('application');
    Route::post('/applications/{application}/resubmit', [ApplicationController::class, 'resubmit'])
        ->whereNumber('application');

    Route::post('/applications/{application}/documents', [ApplicationDocumentController::class, 'store'])
        ->whereNumber('application');
    Route::get('/applications/{application}/documents/{document}', [ApplicationDocumentController::class, 'download'])
        ->whereNumber(['application', 'document']);

    // Back-office : vérification au guichet
    Route::post('/applications/{application}/review/start', [ReviewController::class, 'start'])
        ->whereNumber('application');
    Route::patch('/applications/{application}/documents/{document}/review', [ReviewController::class, 'reviewDocument'])
        ->whereNumber(['application', 'document']);
    Route::post('/applications/{application}/review/return', [ReviewController::class, 'returnToOperator'])
        ->whereNumber('application');
    Route::post('/applications/{application}/review/forward', [ReviewController::class, 'forwardToTechnical'])
        ->whereNumber('application');
    Route::post('/applications/{application}/review/to-decision', [ReviewController::class, 'toDecision'])
        ->whereNumber('application');

    // Back-office : inspection
    Route::get('/backoffice/inspectors', [InspectionController::class, 'inspectors']);
    Route::post('/applications/{application}/inspection/schedule', [ReviewController::class, 'scheduleInspection'])
        ->whereNumber('application');

    // Portail inspecteur
    Route::get('/inspector/inspections', [InspectionController::class, 'queue']);
    Route::post('/applications/{application}/inspection/report', [InspectionController::class, 'submitReport'])
        ->whereNumber('application');

    // Back-office : décision
    Route::post('/applications/{application}/decision/approve', [DecisionController::class, 'approve'])
        ->whereNumber('application');
    Route::post('/applications/{application}/decision/reject', [DecisionController::class, 'reject'])
        ->whereNumber('application');

    // Certificat d'agrément (PDF avec QR de vérification)
    Route::get('/applications/{application}/license/pdf', [LicenseController::class, 'download'])
        ->whereNumber('application');

    Route::get('/backoffice/stats', [StatsController::class, 'index']);

    // Administration (réservé au rôle admin)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::apiResource('license-types', AdminLicenseTypeController::class)
            ->whereNumber('license_type');
        Route::apiResource('users', AdminUserController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->whereNumber('user');
    });
});
