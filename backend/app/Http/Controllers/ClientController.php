<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with('services');
        
        if ($request->has('q')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('phone', 'like', '%' . $request->q . '%');
            });
        }

        return $query->paginate($request->get('limit', 15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'notes' => 'nullable|string',
            'customDuration' => 'nullable|integer',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $client = Client::create($validated);
        
        if (isset($validated['service_ids'])) {
            $client->services()->sync($validated['service_ids']);
        }

        return response()->json($client->load('services'), 201);
    }

    public function show(Client $client)
    {
        return $client->load('services');
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'notes' => 'nullable|string',
            'customDuration' => 'nullable|integer',
            'points' => 'sometimes|integer',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $client->update($validated);
        
        if (isset($validated['service_ids'])) {
            $client->services()->sync($validated['service_ids']);
        }

        return response()->json($client->load('services'));
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(null, 204);
    }
}
