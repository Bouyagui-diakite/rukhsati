<?php

namespace App\Services;

use App\Enums\LicenseStatus;
use App\Models\Application;
use App\Models\License;
use Illuminate\Support\Str;

class LicenseIssuer
{
    public function issue(Application $application): License
    {
        $type = $application->licenseType;
        $year = now()->year;
        $sequence = License::whereYear('created_at', $year)->count() + 1;

        return License::create([
            'application_id' => $application->id,
            'license_type_id' => $type->id,
            'user_id' => $application->user_id,
            'number' => sprintf('MCT-%d-%04d', $year, $sequence),
            'verification_token' => (string) Str::uuid(),
            'status' => LicenseStatus::Valid->value,
            'issued_at' => now()->toDateString(),
            'expires_at' => now()->addMonths($type->validity_months)->toDateString(),
        ]);
    }
}
