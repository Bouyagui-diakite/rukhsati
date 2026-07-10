<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LicenseType extends Model
{
    protected $fillable = [
        'code',
        'name_fr',
        'name_ar',
        'description_fr',
        'description_ar',
        'fee_mru',
        'validity_months',
        'requires_inspection',
        'review_deadline_days',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'requires_inspection' => 'boolean',
            'active' => 'boolean',
        ];
    }

    public function requiredDocuments(): HasMany
    {
        return $this->hasMany(RequiredDocument::class)->orderBy('sort_order');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
