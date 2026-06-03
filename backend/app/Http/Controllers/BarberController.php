<?php

namespace App\Http\Controllers;

use App\Models\Barber;
use Illuminate\Http\Request;

class BarberController extends Controller
{
    public function index()
    {
        return Barber::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'work_schedule' => 'nullable|array',
            'isActive' => 'boolean',
        ]);

        $barber = Barber::create($validated);
        return response()->json($barber, 201);
    }

    public function show(Barber $barber)
    {
        return $barber;
    }

    public function update(Request $request, Barber $barber)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'work_schedule' => 'nullable|array',
            'isActive' => 'boolean',
        ]);

        $barber->update($validated);
        return response()->json($barber);
    }

    public function destroy(Barber $barber)
    {
        $barber->delete();
        return response()->json(null, 204);
    }

    public function earnings(Request $request, Barber $barber)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $appointments = $barber->appointments()
            ->where('status', 'COMPLETED')
            ->whereBetween('updated_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59'])
            ->get();

        $totalEarnings = $appointments->sum('barber_earnings');
        $totalSales = $appointments->sum('totalPrice');
        $appointmentCount = $appointments->count();

        return response()->json([
            'barber' => $barber,
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date,
            ],
            'total_sales' => $totalSales,
            'total_earnings' => $totalEarnings,
            'appointments_count' => $appointmentCount,
            'appointments' => $appointments
        ]);
    }
}
