<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['client', 'barber', 'services']);
        
        if ($request->has('date')) {
            // Asume YYYY-MM-DD
            $query->whereDate('date', $request->date);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'barber_id' => 'required|exists:barbers,id',
            'date' => 'required|date',
            'duration' => 'required|integer',
            'service_ids' => 'required|array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $appointment = Appointment::create([
            'client_id' => $validated['client_id'],
            'barber_id' => $validated['barber_id'],
            'date' => $validated['date'],
            'duration' => $validated['duration'],
            'status' => 'PENDING'
        ]);

        $appointment->services()->attach($validated['service_ids']);

        return response()->json($appointment->load(['client', 'barber', 'services']), 201);
    }

    public function show(Appointment $appointment)
    {
        return $appointment->load(['client', 'barber', 'services']);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'barber_id' => 'sometimes|exists:barbers,id',
            'date' => 'sometimes|date',
            'duration' => 'sometimes|integer',
            'status' => 'sometimes|in:PENDING,COMPLETED,NO_SHOW',
            'service_ids' => 'sometimes|array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $appointment->update($validated);
        
        if ($request->has('service_ids')) {
            $appointment->services()->sync($validated['service_ids']);
        }

        return response()->json($appointment->load(['client', 'barber', 'services']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(null, 204);
    }

    public function checkout(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'totalPrice' => 'required|numeric|min:0',
            'paymentMethod' => 'required|string',
            'isRewardClaimed' => 'sometimes|boolean',
            'claimedRewardPoints' => 'sometimes|integer|min:1',
        ]);

        $config = \App\Models\SystemConfig::first();

        // 0. Check Cash Register if enabled
        if ($config && $config->enableCashRegister) {
            $currentRegister = \App\Models\CashRegister::where('status', 'OPEN')->first();
            if (!$currentRegister) {
                return response()->json(['message' => 'Debes abrir caja antes de facturar'], 400);
            }
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($appointment, $validated) {
            $config = \App\Models\SystemConfig::first();
            
            // 1. Marcar cita completada y calcular comisión
            $barber = $appointment->barber;
            $barberEarnings = $validated['totalPrice'] * ($barber->commission_rate / 100);

            $appointment->update([
                'status' => 'COMPLETED',
                'totalPrice' => $validated['totalPrice'],
                'payment_method' => $validated['paymentMethod'],
                'barber_earnings' => $barberEarnings
            ]);

            // 2. Fidelización: Sumar puntos y manejar hitos
            if ($config && $config->enableLoyalty) {
                // Siempre sumamos un punto por la cita completada
                $newPoints = $appointment->client->points + 1;
                $claimed = $appointment->client->claimed_rewards ?: [];

                if (isset($validated['claimedRewardPoints']) && $validated['claimedRewardPoints'] > 0) {
                    $claimedPoints = $validated['claimedRewardPoints'];
                    
                    // Encontrar si el premio reclamado está configurado para reiniciar puntos
                    $shouldReset = false;
                    if (is_array($config->loyalty_rewards)) {
                        foreach ($config->loyalty_rewards as $reward) {
                            if (isset($reward['points']) && $reward['points'] == $claimedPoints) {
                                if (isset($reward['resets_points']) && $reward['resets_points']) {
                                    $shouldReset = true;
                                }
                                break;
                            }
                        }
                    }

                    if ($shouldReset) {
                        $appointment->client->update([
                            'points' => 0,
                            'claimed_rewards' => []
                        ]);
                    } else {
                        // Premio intermedio: NO se restan puntos, solo se guarda como reclamado
                        if (!in_array($claimedPoints, $claimed)) {
                            $claimed[] = $claimedPoints;
                        }
                        $appointment->client->update([
                            'points' => $newPoints,
                            'claimed_rewards' => $claimed
                        ]);
                    }
                } elseif (isset($validated['isRewardClaimed']) && $validated['isRewardClaimed']) {
                    // Legacy fallback
                    $appointment->client->update(['points' => 0, 'claimed_rewards' => []]);
                } else {
                    $appointment->client->update(['points' => $newPoints]);
                }
            }

            // 3. Descuento de inventario basado en servicios
            if ($config && $config->enableInventory) {
                $services = $appointment->services()->with('inventoryItems')->get();
                foreach ($services as $service) {
                    foreach ($service->inventoryItems as $item) {
                        $quantityToDeduct = $item->pivot->quantity;
                        $item->decrement('stock', $quantityToDeduct);
                    }
                }
            }
        });

        return response()->json($appointment->fresh(['client', 'barber', 'services']));
    }
}
