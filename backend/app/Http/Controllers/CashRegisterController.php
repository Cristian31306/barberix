<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Appointment;
use App\Models\Expense;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    public function current()
    {
        $current = CashRegister::where('status', 'OPEN')->first();
        if (!$current) {
            return response()->json(null);
        }

        // Calculate expected final balance
        $expected = $this->calculateExpectedBalance($current);
        
        $current->expected_balance = $expected;
        
        return response()->json($current);
    }

    public function open(Request $request)
    {
        $validated = $request->validate([
            'initial_balance' => 'required|numeric|min:0'
        ]);

        // Check if there is already an open register
        $current = CashRegister::where('status', 'OPEN')->first();
        if ($current) {
            return response()->json(['message' => 'Ya hay una caja abierta'], 400);
        }

        $register = CashRegister::create([
            'initial_balance' => $validated['initial_balance'],
            'opened_at' => now(),
            'status' => 'OPEN'
        ]);

        return response()->json($register, 201);
    }

    public function close(Request $request)
    {
        $validated = $request->validate([
            'final_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        $current = CashRegister::where('status', 'OPEN')->first();
        if (!$current) {
            return response()->json(['message' => 'No hay una caja abierta'], 400);
        }

        $expected = $this->calculateExpectedBalance($current);

        $current->update([
            'final_balance' => $validated['final_balance'],
            'status' => 'CLOSED',
            'closed_at' => now(),
            'notes' => $validated['notes'] ?? null
        ]);

        $current->expected_balance = $expected;
        $current->difference = $validated['final_balance'] - $expected;

        return response()->json($current);
    }

    public function history()
    {
        $history = CashRegister::orderBy('opened_at', 'desc')->get();
        return response()->json($history);
    }

    private function calculateExpectedBalance($register)
    {
        $endTime = $register->status === 'CLOSED' ? $register->closed_at : now();

        // Cash sales
        $cashSales = Appointment::where('status', 'COMPLETED')
            ->where('payment_method', 'EFECTIVO')
            ->whereBetween('updated_at', [$register->opened_at, $endTime])
            ->sum('totalPrice');

        // Cash expenses (assuming all expenses are cash for now)
        $expenses = Expense::whereBetween('created_at', [$register->opened_at, $endTime])
            ->sum('amount');

        return $register->initial_balance + $cashSales - $expenses;
    }
}
