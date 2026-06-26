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
            $table->boolean('has_break')->default(false)->after('endHour');
            $table->integer('break_start')->default(13)->after('has_break');
            $table->integer('break_end')->default(14)->after('break_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_configs', function (Blueprint $table) {
            $table->dropColumn(['has_break', 'break_start', 'break_end']);
        });
    }
};
