<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inspection extends Model
{
    public const CONCLUSION_FAVORABLE = 'favorable';
    public const CONCLUSION_UNFAVORABLE = 'unfavorable';
    public const CONCLUSION_RESERVED = 'reserved';

    protected $fillable = [
        'application_id',
        'inspector_id',
        'scheduled_for',
        'conducted_at',
        'report',
        'conclusion',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'date',
            'conducted_at' => 'datetime',
            'report' => 'array',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }
}
