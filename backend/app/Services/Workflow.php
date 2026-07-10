<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class Workflow
{
    /**
     * Fait passer un dossier à un nouvel état, en validant la transition
     * et en journalisant l'événement. Toute l'histoire du dossier vit
     * dans application_events — ne jamais modifier le statut autrement.
     */
    public function transition(
        Application $application,
        ApplicationStatus $to,
        ?User $actor = null,
        ?string $comment = null,
    ): Application {
        $from = ApplicationStatus::from($application->status);

        if (! in_array($to, $from->allowedTransitions(), true)) {
            throw new DomainException(
                "Transition interdite : {$from->value} → {$to->value}"
            );
        }

        return DB::transaction(function () use ($application, $from, $to, $actor, $comment) {
            $application->status = $to->value;

            if ($to === ApplicationStatus::Submitted) {
                $application->submitted_at = now();
            }
            if ($to->isFinal()) {
                $application->decided_at = now();
            }

            $application->save();

            $application->events()->create([
                'user_id' => $actor?->id,
                'from_status' => $from->value,
                'to_status' => $to->value,
                'comment' => $comment,
            ]);

            return $application;
        });
    }
}
