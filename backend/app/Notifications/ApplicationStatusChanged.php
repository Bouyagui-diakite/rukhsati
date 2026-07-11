<?php

namespace App\Notifications;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\User;
use Illuminate\Notifications\Notification;

/**
 * Notifie le titulaire d'un dossier lorsqu'il change de statut du fait d'un
 * agent du ministère. Canal « database » : notification consultée dans
 * l'application (pas d'e-mail/SMS pour l'instant).
 */
class ApplicationStatusChanged extends Notification
{
    public function __construct(
        private readonly Application $application,
        private readonly ApplicationStatus $to,
        private readonly ?string $comment,
        private readonly ?User $actor,
    ) {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'reference' => $this->application->reference,
            'to_status' => $this->to->value,
            'status_label' => $this->to->labelFr(),
            'comment' => $this->comment,
            'actor' => $this->actor?->name,
        ];
    }
}
