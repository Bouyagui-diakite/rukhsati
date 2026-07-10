<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained();
            $table->foreignId('license_type_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->string('number')->unique();
            $table->uuid('verification_token')->unique();
            $table->string('status')->default('valid')->index();
            $table->date('issued_at');
            $table->date('expires_at');
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
