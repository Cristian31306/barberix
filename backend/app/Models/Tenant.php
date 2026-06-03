<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = ['name', 'status', 'subscription_ends_at'];

    protected function casts(): array
    {
        return [
            'subscription_ends_at' => 'date',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
