<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return Service::with('inventoryItems')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'isActive' => 'boolean',
            'inventory_items' => 'array',
            'inventory_items.*.id' => 'required|exists:inventory_items,id',
            'inventory_items.*.quantity' => 'required|integer|min:1'
        ]);

        $service = Service::create($request->only('name', 'price', 'duration', 'isActive'));
        
        if ($request->has('inventory_items')) {
            $syncData = [];
            foreach ($request->inventory_items as $item) {
                $syncData[$item['id']] = ['quantity' => $item['quantity']];
            }
            $service->inventoryItems()->sync($syncData);
        }

        return response()->json($service->load('inventoryItems'), 201);
    }

    public function show(Service $service)
    {
        return $service->load('inventoryItems');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'duration' => 'sometimes|integer|min:1',
            'isActive' => 'boolean',
            'inventory_items' => 'array',
            'inventory_items.*.id' => 'required|exists:inventory_items,id',
            'inventory_items.*.quantity' => 'required|integer|min:1'
        ]);

        $service->update($request->only('name', 'price', 'duration', 'isActive'));

        if ($request->has('inventory_items')) {
            $syncData = [];
            foreach ($request->inventory_items as $item) {
                $syncData[$item['id']] = ['quantity' => $item['quantity']];
            }
            $service->inventoryItems()->sync($syncData);
        }

        return response()->json($service->load('inventoryItems'));
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(null, 204);
    }
}
