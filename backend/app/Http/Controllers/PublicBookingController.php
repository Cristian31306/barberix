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

    public function bookedSlots(Request $request, $tenant_id, $barber_id)
    {
        $tenant = Tenant::findOrFail($tenant_id);
        if ($tenant->status !== 'active') {
            return response()->json(['error' => 'This shop is currently inactive.'], 403);
        }

        $date = $request->query('date');
        if (!$date) {
            return response()->json(['error' => 'Date is required.'], 400);
        }

        $appointments = Appointment::where('tenant_id', $tenant_id)
            ->where('barber_id', $barber_id)
            ->whereDate('date', $date)
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->get();

        $bookedSlots = [];

        foreach ($appointments as $apt) {
            $startTime = new \DateTime($apt->date);
            // duration is in minutes
            $duration = $apt->duration;
            $slotsCount = ceil($duration / 30);
            
            for ($i = 0; $i < $slotsCount; $i++) {
                $timeString = $startTime->format('H:i');
                $bookedSlots[] = $timeString;
                $startTime->modify('+30 minutes');
            }
        }

        return response()->json(['booked_slots' => $bookedSlots]);
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

        // Validate overlapping
        $startTime = new \DateTime($validated['date']);
        $endTime = clone $startTime;
        $endTime->modify('+' . $validated['duration'] . ' minutes');

        $overlap = Appointment::where('tenant_id', $tenant_id)
            ->where('barber_id', $validated['barber_id'])
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->where(function($query) use ($startTime, $endTime) {
                // If existing appt starts before new one ends AND ends after new one starts
                $query->where('date', '<', $endTime->format('Y-m-d H:i:s'))
                      ->whereRaw('DATE_ADD(date, INTERVAL duration MINUTE) > ?', [$startTime->format('Y-m-d H:i:s')]);
            })
            ->exists();

        if ($overlap) {
            return response()->json(['error' => 'El horario seleccionado ya no está disponible. Por favor, elige otro.'], 422);
        }

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

        // Load relations for notification
        $appointment->load(['client', 'barber', 'services']);

        // Send Push Notifications
        $subscriptions = \App\Models\PushSubscription::where('tenant_id', $tenant_id)->get();
        if ($subscriptions->isNotEmpty() && config('services.vapid.public_key') && config('services.vapid.private_key')) {
            $auth = [
                'VAPID' => [
                    'subject' => 'mailto:contacto@barberix.com', // can be a URL as well
                    'publicKey' => config('services.vapid.public_key'),
                    'privateKey' => config('services.vapid.private_key'),
                ],
            ];

            $webPush = new \Minishlink\WebPush\WebPush($auth);

            $payload = json_encode([
                'title' => '¡Nueva Cita Agendada!',
                'body' => "{$appointment->client->name} ha agendado con {$appointment->barber->name} para el " . date('d/m/Y H:i', strtotime($appointment->date)),
                'url' => '/dashboard'
            ]);

            foreach ($subscriptions as $sub) {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding,
                ]);

                $webPush->queueNotification($subscription, $payload);
            }

            // Flush (send) notifications
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();

                if (!$report->isSuccess()) {
                    // Subscription expired or invalid, remove it
                    if (in_array($report->getResponse()->getStatusCode(), [404, 410])) {
                        \App\Models\PushSubscription::where('endpoint', $endpoint)->delete();
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment
        ], 201);
    }
}
