<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Notifications récentes de l'utilisateur + nombre de non-lues.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'unread' => $user->unreadNotifications()->count(),
            'items' => $user->notifications()->latest()->limit(20)->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'read' => $n->read_at !== null,
                    'created_at' => $n->created_at->toIso8601String(),
                    'data' => $n->data,
                ]),
        ]);
    }

    /**
     * Marque une notification comme lue.
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification lue.']);
    }

    /**
     * Marque toutes les notifications comme lues.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications sont lues.']);
    }
}
