<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\BarberController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\SystemConfigController;
use App\Http\Controllers\InventoryItemController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\SuperAdminController;

Route::post('/login', [AuthController::class, 'login']);

// Public Booking Routes
Route::prefix('public')->group(function () {
    Route::get('/booking-info/{tenant_id}', [\App\Http\Controllers\PublicBookingController::class, 'info']);
    Route::post('/book/{tenant_id}', [\App\Http\Controllers\PublicBookingController::class, 'book']);
});

Route::middleware(['auth:sanctum', 'superadmin'])->prefix('superadmin')->group(function () {
    Route::get('/tenants', [SuperAdminController::class, 'getTenants']);
    Route::post('/tenants', [SuperAdminController::class, 'createTenant']);
    Route::put('/tenants/{id}/status', [SuperAdminController::class, 'updateTenantStatus']);
    Route::put('/tenants/{id}/subscription', [SuperAdminController::class, 'updateTenantSubscription']);
    Route::put('/users/{id}/password', [SuperAdminController::class, 'resetUserPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('barbers', BarberController::class);
    Route::get('/barbers/{barber}/earnings', [BarberController::class, 'earnings']);
    Route::apiResource('services', ServiceController::class);
    Route::apiResource('inventory', InventoryItemController::class);
    Route::apiResource('appointments', AppointmentController::class);
    Route::post('/appointments/{appointment}/checkout', [AppointmentController::class, 'checkout']);
    
    // Config
    Route::get('/config', [SystemConfigController::class, 'show']);
    Route::put('/config', [SystemConfigController::class, 'update']);

    // Finances (Phase 1)
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/dashboard/metrics', [DashboardController::class, 'getMetrics']);

    // Cash Register
    Route::get('/cash-register/current', [App\Http\Controllers\CashRegisterController::class, 'current']);
    Route::post('/cash-register/open', [App\Http\Controllers\CashRegisterController::class, 'open']);
    Route::post('/cash-register/close', [App\Http\Controllers\CashRegisterController::class, 'close']);
    Route::get('/cash-register/history', [App\Http\Controllers\CashRegisterController::class, 'history']);

    Route::get('/vapid-public-key', function () {
        return response()->json(['key' => env('VAPID_PUBLIC_KEY')]);
    });

    // POS
    Route::post('/pos/checkout', [App\Http\Controllers\PosController::class, 'checkout']);

    // Push Notifications
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store']);
});
