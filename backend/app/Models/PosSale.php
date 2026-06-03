<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSale extends Model
{
    protected $fillable = ['tenant_id', 'client_id', 'total_amount', 'payment_method', 'date'];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'total_amount' => 'decimal:2'
        ];
    }

    public function items()
    {
        return $this->hasMany(PosSaleItem::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
