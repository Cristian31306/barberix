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
        'has_break',
        'break_start',
        'break_end',
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
        'has_break' => 'boolean',
        'startHour' => 'integer',
        'endHour' => 'integer',
        'break_start' => 'integer',
        'break_end' => 'integer',
        'points_for_reward' => 'integer',
        'loyalty_rewards' => 'array'
    ];
}
