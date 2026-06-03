<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use SoftDeletes;
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'name',
        'stock',
        'minStock',
        'deductPerCut',
        'autoDeduct',
        'tenant_id'
    ];

    protected $casts = [
        'stock' => 'integer',
        'minStock' => 'integer',
        'deductPerCut' => 'decimal:2',
        'autoDeduct' => 'boolean'
    ];

    public function services()
    {
        return $this->belongsToMany(Service::class)->withPivot('quantity')->withTimestamps();
    }
}
