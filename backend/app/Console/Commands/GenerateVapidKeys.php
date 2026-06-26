<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vapid:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for Web Push';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $keys = VAPID::createVapidKeys();
        $this->info("Public Key: " . $keys['publicKey']);
        $this->info("Private Key: " . $keys['privateKey']);
    }
}
