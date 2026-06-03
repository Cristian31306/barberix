<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\Service;
use App\Models\Barber;
use App\Models\Client;
use App\Models\Appointment;
use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicBookingController extends Controller
{
    public function info($tenant_id)
    {
        $tenant = Tenant::findOrFail($tenant_id);

        if ($tenant->status !== 'active') {
            return response()->json(['error' => 'This shop is currently inactive.'], 403);
        }

        $config = SystemConfig::where('tenant_id', $tenant_id)->first();
        
        // Active barbers for this tenant
        $barbers = Barber::where('tenant_id', $tenant_id)
            ->where('isActive', true)
            ->select('id', 'name', 'work_schedule')
            ->get();

        // Active services for this tenant
        $services = Service::where('tenant_id', $tenant_id)
            ->select('id', 'name', 'price', 'duration')
            ->get();

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name
            ],
            'config' => $config,
            'barbers' => $barbers,
            'services' => $services
        ]);
    }

    public function book(Request $request, $tenant_id)
    {
        $tenant = Tenant::findOrFail($tenant_id);

        if ($tenant->status !== 'active') {
            return response()->json(['error' => 'This shop is currently inactive.'], 403);
        }

        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'client_phone' => 'required|string|max:20',
            'client_email' => 'nullable|email|max:255',
            'barber_id' => 'required|exists:barbers,id',
            'date' => 'required|date',
            'duration' => 'required|integer',
            'service_ids' => 'required|array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $appointment = DB::transaction(function () use ($tenant_id, $validated) {
            // Find or create client by phone within the tenant scope
            $client = Client::where('tenant_id', $tenant_id)
                ->where('phone', $validated['client_phone'])
                ->first();

            if (!$client) {
                $client = Client::create([
                    'tenant_id' => $tenant_id,
                    'name' => $validated['client_name'],
                    'phone' => $validated['client_phone'],
                    'email' => $validated['client_email'],
                ]);
            } else {
                // Update name if it changed? Optional.
                $client->update([
                    'name' => $validated['client_name'],
                    'email' => $validated['client_email'] ?? $client->email
                ]);
            }

            // Calculate total price based on services (could also be passed from frontend, but backend is safer)
            $services = Service::whereIn('id', $validated['service_ids'])->where('tenant_id', $tenant_id)->get();
            $totalPrice = $services->sum('price');

            $appointment = Appointment::create([
                'tenant_id' => $tenant_id,
                'client_id' => $client->id,
                'barber_id' => $validated['barber_id'],
                'date' => $validated['date'],
                'duration' => $validated['duration'],
                'status' => 'PENDING',
                'totalPrice' => $totalPrice
            ]);

            $appointment->services()->attach($validated['service_ids']);

            return $appointment;
        });

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment->load(['client', 'barber', 'services'])
        ], 201);
    }
}
