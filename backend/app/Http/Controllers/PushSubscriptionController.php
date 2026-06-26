<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = Auth::user();

        // Use updateOrCreate so we don't have duplicates for the same endpoint
        $subscription = PushSubscription::updateOrCreate(
            ['endpoint' => $validated['endpoint']],
            [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => 'aesgcm',
            ]
        );

        return response()->json(['message' => 'Subscription saved successfully.']);
    }
}
