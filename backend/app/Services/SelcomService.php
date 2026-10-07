<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SelcomService
{
    public function enabled(): bool
    {
        $config = config('services.selcom');
        if (! ($config['enabled'] ?? false)) {
            return false;
        }
        foreach (['base_url', 'vendor', 'api_key', 'api_secret'] as $field) {
            if (! is_string($config[$field] ?? null) || trim($config[$field]) === '') {
                return false;
            }
        }

        // Credentials must never travel over plaintext HTTP or URL user-info.
        $url = parse_url($config['base_url']);

        return ($url['scheme'] ?? '') === 'https' && ! empty($url['host'])
            && ! isset($url['user']) && ! isset($url['pass']) && ! isset($url['query']) && ! isset($url['fragment']);
    }

    public static function normalizePhone(mixed $input): ?string
    {
        if (! is_string($input)) {
            return null;
        }
        $phone = preg_replace('/[\s()+-]/', '', $input);
        if (preg_match('/^0[67]\d{8}$/', $phone)) {
            $phone = '255'.substr($phone, 1);
        }

        return preg_match('/^255[67]\d{8}$/', $phone) ? $phone : null;
    }

    public function headers(array $data, ?string $timestamp = null): array
    {
        $timestamp ??= now()->format('Y-m-d\TH:i:sP');
        $signed = 'timestamp='.$timestamp;
        foreach ($data as $key => $value) {
            $signed .= '&'.$key.'='.$value;
        }

        return [
            'Authorization' => 'SELCOM '.base64_encode(config('services.selcom.api_key')),
            'Timestamp' => $timestamp,
            'Digest-Method' => 'HS256',
            'Digest' => base64_encode(hash_hmac('sha256', $signed, config('services.selcom.api_secret'), true)),
            'Signed-Fields' => implode(',', array_keys($data)),
        ];
    }

    public function createOrder(Order $order, PaymentAttempt $attempt, string $phone): array
    {
        $user = User::findOrFail($order->user_id);

        return $this->request('POST', 'create-order-minimal', [
            'vendor' => config('services.selcom.vendor'),
            'order_id' => $attempt->selcom_order_id,
            'buyer_email' => $user->email,
            'buyer_name' => $order->delivery['name'],
            'buyer_phone' => $phone,
            'amount' => self::amount((int) $order->total_cents),
            'currency' => 'TZS',
            'no_of_items' => $order->items()->sum('quantity'),
            'webhook' => base64_encode(rtrim(config('app.url'), '/').'/api/selcom/webhook'),
            'redirect_url' => base64_encode(rtrim(config('app.url'), '/').'/track?order='.$order->id),
            'cancel_url' => base64_encode(rtrim(config('app.url'), '/').'/track?order='.$order->id),
        ]);
    }

    public static function amount(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function amountCents(mixed $amount): ?int
    {
        // Compare exact decimal strings; never float-round a provider amount.
        if (! is_scalar($amount) || ! preg_match('/^(\d{1,10})(?:\.(\d{1,2}))?$/D', (string) $amount, $matches)) {
            return null;
        }

        return (int) $matches[1] * 100 + (int) str_pad($matches[2] ?? '', 2, '0');
    }

    public function walletPayment(PaymentAttempt $attempt, string $phone): array
    {
        return $this->request('POST', 'wallet-payment', [
            'transid' => $attempt->wallet_transaction_id,
            'order_id' => $attempt->selcom_order_id,
            'msisdn' => $phone,
        ]);
    }

    public function orderStatus(PaymentAttempt $attempt): array
    {
        return $this->request('GET', 'order-status', ['order_id' => $attempt->selcom_order_id]);
    }

    public static function paymentUrl(array $response): ?string
    {
        $encoded = $response['data'][0]['payment_gateway_url'] ?? null;
        $url = is_string($encoded) ? base64_decode($encoded, true) : false;
        if (! $url || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        $parts = parse_url($url);

        return ($parts['scheme'] ?? '') === 'https' && ! isset($parts['user']) && ! isset($parts['pass']) ? $url : null;
    }

    private function request(string $method, string $path, array $data): array
    {
        if (! $this->enabled()) {
            throw new SelcomException('Mobile-money payments are not configured.');
        }
        try {
            $response = Http::acceptJson()->asJson()->withHeaders($this->headers($data))
                ->connectTimeout(5)->timeout(15)->withoutRedirecting()
                ->send($method, rtrim(config('services.selcom.base_url'), '/').'/v1/checkout/'.$path,
                    [$method === 'GET' ? 'query' : 'json' => $data]);
            $body = $response->json();
            if (! $response->successful() || ! is_array($body) || ! isset($body['resultcode'], $body['result'])) {
                throw new SelcomException('Invalid payment provider response.');
            }

            return $body;
        } catch (Throwable $exception) {
            // No request/response bodies, phone numbers, URLs or credential-bearing exceptions.
            Log::warning('Selcom request unavailable', ['operation' => $path, 'error_type' => class_basename($exception)]);
            throw new SelcomException('Payment verification is unavailable. Your order is saved; check tracking before retrying.');
        }
    }
}
