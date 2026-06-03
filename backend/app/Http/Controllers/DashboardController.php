<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getMetrics(Request $request)
    {
        $startDate = $request->query('start_date', date('Y-m-01')); // Default to start of month
        $endDate = $request->query('end_date', date('Y-m-t')); // Default to end of month

        // 1. Total Income (Completed Appointments)
        $completedAppointments = Appointment::whereBetween('date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', 'COMPLETED')
            ->get();
        
        $totalIncome = $completedAppointments->sum('totalPrice');

        // 2. Total Expenses
        $totalExpenses = Expense::whereBetween('date', [$startDate, $endDate])
            ->sum('amount');

        // 3. Net Profit
        $netProfit = $totalIncome - $totalExpenses;

        // 4. Top Barbers
        $topBarbers = Appointment::with('barber')
            ->whereBetween('date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', 'COMPLETED')
            ->select('barber_id', DB::raw('SUM(totalPrice) as total_sales'), DB::raw('COUNT(*) as total_cuts'))
            ->groupBy('barber_id')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->barber_id,
                    'name' => $apt->barber ? $apt->barber->name : 'Desconocido',
                    'total_sales' => $apt->total_sales,
                    'total_cuts' => $apt->total_cuts
                ];
            });

        return response()->json([
            'income' => $totalIncome,
            'expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'top_barbers' => $topBarbers
        ]);
    }
}
