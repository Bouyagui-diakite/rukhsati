<?php

namespace App\Enums;

enum LicenseStatus: string
{
    case Valid = 'valid';
    case Suspended = 'suspended';
    case Expired = 'expired';
    case Revoked = 'revoked';

    public function labelFr(): string
    {
        return match ($this) {
            self::Valid => 'Valide',
            self::Suspended => 'Suspendu',
            self::Expired => 'Expiré',
            self::Revoked => 'Révoqué',
        };
    }
}
