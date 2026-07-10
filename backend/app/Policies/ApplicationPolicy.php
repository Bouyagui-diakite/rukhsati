<?php

namespace App\Policies;

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $application->user_id === $user->id || $user->roleEnum()->isStaff();
    }

    public function update(User $user, Application $application): bool
    {
        return $application->user_id === $user->id;
    }

    public function delete(User $user, Application $application): bool
    {
        return $application->user_id === $user->id
            && $application->statusEnum() === ApplicationStatus::Draft;
    }

    public function review(User $user, Application $application): bool
    {
        return in_array($user->roleEnum(), [UserRole::Officer, UserRole::Admin], true);
    }

    public function inspect(User $user, Application $application): bool
    {
        return in_array($user->roleEnum(), [UserRole::Inspector, UserRole::Admin], true);
    }

    public function decide(User $user, Application $application): bool
    {
        return in_array($user->roleEnum(), [UserRole::Director, UserRole::Admin], true);
    }
}
