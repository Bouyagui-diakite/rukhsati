<?php

namespace App\Http\Controllers\BackOffice;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\License;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->roleEnum()->isStaff(), 403);

        $byStatus = Application::whereNot('status', ApplicationStatus::Draft->value)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $avgProcessingDays = Application::whereNotNull('decided_at')
            ->whereNotNull('submitted_at')
            ->get(['submitted_at', 'decided_at'])
            ->map(fn ($a) => $a->submitted_at->diffInDays($a->decided_at))
            ->avg();

        return response()->json([
            'by_status' => $byStatus,
            'pending_decision' => (int) ($byStatus[ApplicationStatus::AwaitingDecision->value] ?? 0),
            'licenses_issued' => License::count(),
            'avg_processing_days' => $avgProcessingDays !== null ? round($avgProcessingDays, 1) : null,
            'by_type' => Application::whereNot('status', ApplicationStatus::Draft->value)
                ->join('license_types', 'license_types.id', '=', 'applications.license_type_id')
                ->selectRaw('license_types.name_fr as type, count(*) as total')
                ->groupBy('license_types.name_fr')
                ->pluck('total', 'type'),
        ]);
    }
}
