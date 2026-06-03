<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'startHour',
        'endHour',
        'enableLoyalty',
        'enableInventory',
        'enableCashRegister',
        'points_for_reward',
        'loyalty_rewards',
        'tenant_id'
    ];

    protected $casts = [
        'enableLoyalty' => 'boolean',
        'enableInventory' => 'boolean',
        'enableCashRegister' => 'boolean',
        'startHour' => 'integer',
        'endHour' => 'integer',
        'points_for_reward' => 'integer',
        'loyalty_rewards' => 'array'
    ];
}
