<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'name',
        'phone',
        'points',
        'notes',
        'customDuration',
        'tenant_id',
        'claimed_rewards'
    ];

    protected $casts = [
        'claimed_rewards' => 'array',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'client_service');
    }
}
