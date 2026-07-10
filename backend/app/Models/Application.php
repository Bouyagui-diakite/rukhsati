<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Application extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'license_type_id',
        'status',
        'form_data',
    ];

    protected function casts(): array
    {
        return [
            'form_data' => 'array',
            'submitted_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function statusEnum(): ApplicationStatus
    {
        return ApplicationStatus::from($this->status);
    }

    public static function nextReference(): string
    {
        $year = now()->year;
        $count = static::whereYear('created_at', $year)->count() + 1;

        return sprintf('AGR-%d-%04d', $year, $count);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function licenseType(): BelongsTo
    {
        return $this->belongsTo(LicenseType::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class)->latest('created_at');
    }

    public function inspection(): HasOne
    {
        return $this->hasOne(Inspection::class);
    }

    public function license(): HasOne
    {
        return $this->hasOne(License::class);
    }
}
