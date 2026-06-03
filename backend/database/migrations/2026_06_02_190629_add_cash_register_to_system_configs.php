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
        Schema::table('system_configs', function (Blueprint $table) {
            $table->boolean('enableCashRegister')->default(false)->after('points_for_reward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_configs', function (Blueprint $table) {
            $table->dropColumn('enableCashRegister');
        });
    }
};
