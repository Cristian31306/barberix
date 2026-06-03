<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Barber extends Model
{
    use SoftDeletes;
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'isActive',
        'commission_rate',
        'work_schedule'
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'commission_rate' => 'decimal:2',
        'work_schedule' => 'array'
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
