<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use SoftDeletes;
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'client_id',
        'barber_id',
        'date',
        'duration',
        'status',
        'totalPrice',
        'payment_method',
        'barber_earnings',
        'tenant_id'
    ];

    protected $casts = [
        'date' => 'datetime',
        'totalPrice' => 'decimal:2'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class)->withTrashed();
    }

    public function barber()
    {
        return $this->belongsTo(Barber::class)->withTrashed();
    }

    public function services()
    {
        return $this->belongsToMany(Service::class)->withTrashed();
    }
}
