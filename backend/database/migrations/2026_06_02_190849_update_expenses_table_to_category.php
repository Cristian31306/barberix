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
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'type')) {
                $table->renameColumn('type', 'category');
            }
            if (!Schema::hasColumn('expenses', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->renameColumn('category', 'type');
            $table->dropSoftDeletes();
        });
    }
};
