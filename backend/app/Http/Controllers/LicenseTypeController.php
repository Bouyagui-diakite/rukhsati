<?php

namespace App\Http\Controllers;

use App\Models\LicenseType;
use Illuminate\Http\JsonResponse;

class LicenseTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            LicenseType::where('active', true)
                ->with('requiredDocuments')
                ->orderBy('name_fr')
                ->get()
        );
    }
}
