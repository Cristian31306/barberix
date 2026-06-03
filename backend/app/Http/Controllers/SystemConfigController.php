<?php

namespace App\Http\Controllers;

use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SystemConfigController extends Controller
{
    public function show()
    {
        $tenantId = Auth::user()->tenant_id;
        
        if (!$tenantId) {
            return response()->json([
                'startHour' => 8,
                'endHour' => 20,
                'enableLoyalty' => false,
                'enableInventory' => false,
                'enableCashRegister' => false,
                'points_for_reward' => 10,
                'loyalty_rewards' => []
            ]);
        }

        // Get or create the config for this tenant
        $config = SystemConfig::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'startHour' => 8,
                'endHour' => 20,
                'enableLoyalty' => false,
                'enableInventory' => false,
                'enableCashRegister' => false,
                'points_for_reward' => 10,
                'loyalty_rewards' => []
            ]
        );
        
        return response()->json($config);
    }

    public function update(Request $request)
    {
        $config = SystemConfig::first();
        
        if (!$config) {
            return response()->json(['error' => 'Config not found'], 404);
        }

        $validated = $request->validate([
            'startHour' => 'sometimes|integer|min:0|max:23',
            'endHour' => 'sometimes|integer|min:0|max:23|gt:startHour',
            'enableLoyalty' => 'boolean',
            'enableInventory' => 'boolean',
            'enableCashRegister' => 'boolean',
            'points_for_reward' => 'sometimes|integer|min:1',
            'loyalty_rewards' => 'sometimes|array'
        ]);

        $config->update($validated);
        return response()->json($config);
    }
}
