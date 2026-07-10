<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('required_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_type_id')->constrained()->cascadeOnDelete();
            $table->string('name_fr');
            $table->string('name_ar');
            $table->boolean('mandatory')->default(true);
            $table->string('accepted_formats')->default('pdf,jpg,png');
            $table->unsignedInteger('max_size_kb')->default(5120);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('required_documents');
    }
};
