<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ApplicationDocumentController extends Controller
{
    public function store(Request $request, Application $application): JsonResponse
    {
        Gate::authorize('update', $application);

        $status = $application->statusEnum();
        if (! in_array($status, [ApplicationStatus::Draft, ApplicationStatus::AwaitingDocuments], true)) {
            throw ValidationException::withMessages([
                'status' => 'Les pièces ne peuvent être déposées que sur un brouillon ou un dossier renvoyé.',
            ]);
        }

        $request->validate([
            'required_document_id' => ['required', 'integer'],
        ]);

        $required = $application->licenseType->requiredDocuments()
            ->findOrFail($request->integer('required_document_id'));

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.$required->max_size_kb,
                'mimes:'.$required->accepted_formats,
            ],
        ]);

        $file = $request->file('file');
        $path = $file->store("applications/{$application->id}");

        $previous = $application->documents()
            ->where('required_document_id', $required->id)
            ->first();

        if ($previous) {
            Storage::delete($previous->path);
            $previous->delete();
        }

        $document = $application->documents()->create([
            'required_document_id' => $required->id,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size_kb' => (int) round($file->getSize() / 1024),
            'status' => ApplicationDocument::STATUS_PENDING,
        ]);

        return response()->json($document->load('requiredDocument'), 201);
    }

    public function download(Request $request, Application $application, ApplicationDocument $document)
    {
        Gate::authorize('view', $application);

        abort_unless($document->application_id === $application->id, 404);

        return Storage::download($document->path, $document->original_name);
    }
}
