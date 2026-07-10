<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequiredDocument extends Model
{
    protected $fillable = [
        'license_type_id',
        'name_fr',
        'name_ar',
        'mandatory',
        'accepted_formats',
        'max_size_kb',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'mandatory' => 'boolean',
        ];
    }

    public function licenseType(): BelongsTo
    {
        return $this->belongsTo(LicenseType::class);
    }
}
