<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    // Listar todas las barberías
    public function getTenants()
    {
        return response()->json(Tenant::with('users')->get());
    }

    // Crear una nueva barbería con su administrador principal
    public function createTenant(Request $request)
    {
        $validated = $request->validate([
            'tenant_name' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:6',
            'subscription_ends_at' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            // 1. Crear el Tenant
            $tenant = Tenant::create([
                'name' => $validated['tenant_name'],
                'status' => 'active',
                'subscription_ends_at' => $validated['subscription_ends_at'] ?? null,
            ]);

            // 2. Crear el Usuario Administrador de ese Tenant
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'role' => 'admin',
                'tenant_id' => $tenant->id
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Barbería y administrador creados exitosamente',
                'tenant' => $tenant->load('users')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al crear la barbería', 'error' => $e->getMessage()], 500);
        }
    }

    // Suspender o Activar una barbería (Bloqueo por falta de pago)
    public function updateTenantStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,suspended'
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Estado de la barbería actualizado', 'tenant' => $tenant]);
    }

    // Actualizar fecha de suscripción
    public function updateTenantSubscription(Request $request, $id)
    {
        $validated = $request->validate([
            'subscription_ends_at' => 'required|date'
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->update(['subscription_ends_at' => $validated['subscription_ends_at']]);

        return response()->json(['message' => 'Suscripción actualizada', 'tenant' => $tenant]);
    }

    // Cambiar la contraseña temporal de cualquier usuario (Ej. dueño de barbería)
    public function resetUserPassword(Request $request, $userId)
    {
        $validated = $request->validate([
            'new_password' => 'required|string|min:6'
        ]);

        $user = User::findOrFail($userId);
        
        // No permitir que un admin cambie la clave de otro superadmin
        if ($user->role === 'superadmin') {
            return response()->json(['message' => 'No puedes cambiar la contraseña de otro SuperAdmin'], 403);
        }

        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json(['message' => 'Contraseña actualizada exitosamente para ' . $user->email]);
    }
}
