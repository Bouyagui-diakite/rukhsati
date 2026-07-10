<?php

namespace App\Enums;

enum UserRole: string
{
    case Operator = 'operator';
    case Officer = 'officer';
    case Inspector = 'inspector';
    case Director = 'director';
    case Admin = 'admin';

    public function isStaff(): bool
    {
        return $this !== self::Operator;
    }
}
