<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case AwaitingDocuments = 'awaiting_documents';
    case TechnicalReview = 'technical_review';
    case Inspection = 'inspection';
    case AwaitingDecision = 'awaiting_decision';
    case Approved = 'approved';
    case Rejected = 'rejected';

    /**
     * @return array<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Submitted],
            self::Submitted => [self::UnderReview],
            self::UnderReview => [self::AwaitingDocuments, self::TechnicalReview],
            self::AwaitingDocuments => [self::UnderReview],
            self::TechnicalReview => [self::Inspection, self::AwaitingDecision],
            self::Inspection => [self::AwaitingDecision],
            self::AwaitingDecision => [self::Approved, self::Rejected],
            self::Approved, self::Rejected => [],
        };
    }

    public function isFinal(): bool
    {
        return $this->allowedTransitions() === [];
    }

    public function labelFr(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Submitted => 'Soumis',
            self::UnderReview => 'En vérification',
            self::AwaitingDocuments => 'Pièces manquantes',
            self::TechnicalReview => 'Instruction technique',
            self::Inspection => 'Inspection en cours',
            self::AwaitingDecision => 'En attente de décision',
            self::Approved => 'Approuvé',
            self::Rejected => 'Rejeté',
        };
    }
}
