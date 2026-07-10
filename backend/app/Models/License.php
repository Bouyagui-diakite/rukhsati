<?php

namespace App\Models;

use App\Enums\LicenseStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class License extends Model
{
    protected $fillable = [
        'application_id',
        'license_type_id',
        'user_id',
        'number',
        'verification_token',
        'status',
        'issued_at',
        'expires_at',
        'pdf_path',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'expires_at' => 'date',
        ];
    }

    public function statusEnum(): LicenseStatus
    {
        if ($this->status === LicenseStatus::Valid->value && $this->expires_at->isPast()) {
            return LicenseStatus::Expired;
        }

        return LicenseStatus::from($this->status);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function licenseType(): BelongsTo
    {
        return $this->belongsTo(LicenseType::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
