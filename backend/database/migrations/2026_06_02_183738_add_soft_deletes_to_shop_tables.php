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
        $tables = ['clients', 'barbers', 'services', 'inventory_items', 'appointments'];
        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['clients', 'barbers', 'services', 'inventory_items', 'appointments'];
        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
