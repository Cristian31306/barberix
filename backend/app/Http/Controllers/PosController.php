<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemConfig;
use App\Models\CashRegister;
use App\Models\CashRegisterTransaction;
use App\Models\InventoryItem;
use App\Models\PosSale;
use App\Models\PosSaleItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    public function checkout(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string|in:CASH,CARD,TRANSFER'
        ]);

        $config = SystemConfig::firstOrCreate(['tenant_id' => $tenantId]);
        
        // If cash register is enabled, ensure one is open
        $activeRegister = null;
        if ($config->enableCashRegister) {
            $activeRegister = CashRegister::where('tenant_id', $tenantId)
                ->where('status', 'OPEN')
                ->first();

            if (!$activeRegister) {
                return response()->json(['error' => 'Debe abrir caja antes de poder realizar ventas.'], 403);
            }
        }

        $sale = DB::transaction(function () use ($tenantId, $validated, $activeRegister) {
            $totalAmount = 0;
            $itemsData = [];

            // 1. Calculate total and check stock
            foreach ($validated['items'] as $itemReq) {
                $invItem = InventoryItem::where('tenant_id', $tenantId)->lockForUpdate()->findOrFail($itemReq['inventory_item_id']);
                
                if ($invItem->stock_quantity < $itemReq['quantity']) {
                    throw new \Exception("No hay stock suficiente para el producto: {$invItem->name}. Stock actual: {$invItem->stock_quantity}");
                }

                $price = $invItem->price;
                $lineTotal = $price * $itemReq['quantity'];
                $totalAmount += $lineTotal;

                $itemsData[] = [
                    'inventory_item_id' => $invItem->id,
                    'quantity' => $itemReq['quantity'],
                    'unit_price' => $price,
                    'invItem' => $invItem // Reference to deduct later
                ];
            }

            // 2. Create PosSale
            $sale = PosSale::create([
                'tenant_id' => $tenantId,
                'client_id' => $validated['client_id'] ?? null,
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'date' => now()
            ]);

            // 3. Create items and deduct stock
            foreach ($itemsData as $data) {
                PosSaleItem::create([
                    'pos_sale_id' => $sale->id,
                    'inventory_item_id' => $data['inventory_item_id'],
                    'quantity' => $data['quantity'],
                    'unit_price' => $data['unit_price']
                ]);

                // Deduct stock
                $data['invItem']->decrement('stock_quantity', $data['quantity']);
            }

            // 4. Register transaction in Cash Register if active
            if ($activeRegister) {
                CashRegisterTransaction::create([
                    'cash_register_id' => $activeRegister->id,
                    'type' => 'INCOME',
                    'amount' => $totalAmount,
                    'description' => 'Venta en POS #' . $sale->id,
                    'payment_method' => $validated['payment_method']
                ]);
            }

            return $sale->load('items.inventoryItem');
        });

        return response()->json([
            'message' => 'Venta realizada con éxito',
            'sale' => $sale
        ], 201);
    }
}
