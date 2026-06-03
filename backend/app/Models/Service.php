<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'name',
        'price',
        'duration',
        'isActive',
        'tenant_id'
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'price' => 'decimal:2',
        'duration' => 'integer'
    ];

    public function appointments()
    {
        return $this->belongsToMany(Appointment::class);
    }

    public function inventoryItems()
    {
        return $this->belongsToMany(InventoryItem::class)->withPivot('quantity')->withTimestamps();
    }
}
