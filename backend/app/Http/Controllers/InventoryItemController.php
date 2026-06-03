<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    public function index()
    {
        return InventoryItem::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'minStock' => 'required|integer|min:0',
            'deductPerCut' => 'required|numeric|min:0',
            'autoDeduct' => 'boolean',
        ]);

        $item = InventoryItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(InventoryItem $inventoryItem)
    {
        return $inventoryItem;
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'stock' => 'sometimes|integer|min:0',
            'minStock' => 'sometimes|integer|min:0',
            'deductPerCut' => 'sometimes|numeric|min:0',
            'autoDeduct' => 'boolean',
        ]);

        $inventoryItem->update($validated);
        return response()->json($inventoryItem);
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->delete();
        return response()->json(null, 204);
    }
}
