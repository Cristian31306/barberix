<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSaleItem extends Model
{
    protected $fillable = ['pos_sale_id', 'inventory_item_id', 'quantity', 'unit_price'];

    public function posSale()
    {
        return $this->belongsTo(PosSale::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
