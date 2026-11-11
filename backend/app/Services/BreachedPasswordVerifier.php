<?php

namespace App\Services;

use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Support\Facades\Http;

class BreachedPasswordVerifier implements UncompromisedVerifier
{
    public function verify($data): bool
    {
        $hash = strtoupper(sha1((string) $data['value']));
        try {
            $response = Http::withHeaders(['Add-Padding' => 'true'])->timeout(3)->get('https://api.pwnedpasswords.com/range/'.substr($hash, 0, 5));
            if (!$response->successful()) return true;
            foreach (explode("\n", $response->body()) as $line) {
                $parts = explode(':', trim($line), 2);
                if (count($parts) === 2 && hash_equals(substr($hash, 5), $parts[0]) && (int) $parts[1] > ($data['threshold'] ?? 0)) return false;
            }
        } catch (\Illuminate\Http\Client\ConnectionException) { return true; }
        return true;
    }
}
