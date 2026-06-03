<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('barber_id')->constrained()->onDelete('cascade');
            $table->dateTime('date');
            $table->integer('duration');
            $table->enum('status', ['PENDING', 'COMPLETED', 'NO_SHOW'])->default('PENDING');
            $table->decimal('totalPrice', 10, 2)->nullable();
            $table->enum('paymentMethod', ['CASH', 'TRANSFER', 'CARD'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
