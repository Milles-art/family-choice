<?php

namespace Tests\Feature;

use App\Jobs\SendOrderConfirmation;
use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Services\SelcomService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Mail\SentMessage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class PaymentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Queue::fake();
        Http::preventStrayRequests();
        config()->set('services.selcom', ['enabled' => true, 'base_url' => 'https://selcom.example.test',
            'vendor' => 'TEST', 'api_key' => 'test-key', 'api_secret' => 'test-secret']);
        config()->set('app.url', 'https://familychoiceminimarket.co.tz');
        $this->actingAs(User::factory()->create());
    }

    private function payload(): array
    {
        return ['requestId' => (string) Str::uuid(), 'items' => [['productId' => 'p1', 'quantity' => 2]],
            'delivery' => ['name' => 'Customer', 'phone' => '+255700000000', 'address' => 'Test Street', 'city' => 'Test City'],
            'deliveryOption' => 'delivery', 'timeSlot' => 'Tomorrow', 'paymentMethod' => 'selcom',
            'paymentProvider' => 'mpesa', 'payerPhone' => '0712 345 678'];
    }

    private function provider(string $status = 'PENDING', array $overrides = []): void
    {
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake(function ($request) use ($status, $overrides) {
            if (str_contains($request->url(), 'create-order-minimal')) {
                return Http::response(['result' => 'SUCCESS', 'resultcode' => '000', 'data' => [
                    ['payment_gateway_url' => base64_encode('https://selcom.example.test/pay')],
                ]]);
            }
            if (str_contains($request->url(), 'wallet-payment')) {
                return Http::response(['result' => 'PENDING', 'resultcode' => '111', 'data' => []]);
            }
            $attempt = PaymentAttempt::where('selcom_order_id', $request['order_id'])->firstOrFail();

            return Http::response(['result' => 'SUCCESS', 'resultcode' => '000', 'data' => [array_merge([
                'order_id' => $attempt->selcom_order_id, 'amount' => SelcomService::amount($attempt->order->total_cents),
                'payment_status' => $status, 'reference' => 'VERIFIED-REF', 'transid' => 'VERIFIED-TX', 'channel' => 'MPESA-TZ',
            ], $overrides)]]);
        });
    }

    private function checkout(): Order
    {
        $response = $this->postJson('/api/orders', $this->payload())->assertCreated();

        return Order::findOrFail($response->json('id'));
    }

    public function test_settings_require_explicit_enablement_and_every_credential(): void
    {
        $this->getJson('/api/settings')->assertJsonPath('selcom_enabled', true);
        foreach (['base_url', 'vendor', 'api_key', 'api_secret'] as $key) {
            $old = config('services.selcom.'.$key);
            config()->set('services.selcom.'.$key, '');
            $this->getJson('/api/settings')->assertJsonPath('selcom_enabled', false);
            config()->set('services.selcom.'.$key, $old);
        }
        config()->set('services.selcom.base_url', 'http://example.test');
        $this->getJson('/api/settings')->assertJsonPath('selcom_enabled', false);
        config()->set('services.selcom.base_url', 'https://selcom.example.test');
        config()->set('services.selcom.enabled', false);
        $this->getJson('/api/settings')->assertJsonPath('selcom_enabled', false);
        $this->postJson('/api/orders', $this->payload())->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_signing_matches_the_official_hmac_protocol(): void
    {
        $headers = app(SelcomService::class)->headers(['order_id' => 'TEST', 'amount' => '17272.00'], '2026-10-08T10:00:00+03:00');
        $this->assertSame('SELCOM '.base64_encode('test-key'), $headers['Authorization']);
        $this->assertSame('order_id,amount', $headers['Signed-Fields']);
        $this->assertSame('HS256', $headers['Digest-Method']);
        $this->assertSame(base64_encode(hash_hmac('sha256', 'timestamp=2026-10-08T10:00:00+03:00&order_id=TEST&amount=17272.00', 'test-secret', true)), $headers['Digest']);
    }

    public function test_checkout_normalizes_phone_signs_server_total_and_never_duplicates_a_push(): void
    {
        $this->provider();
        $payload = $this->payload();
        $response = $this->postJson('/api/orders', $payload)->assertCreated()->assertJsonPath('payment_status', 'pending')
            ->assertJsonPath('total_cents', 1727200)->assertJsonPath('payment_url', 'https://selcom.example.test/pay')
            ->assertJsonPath('masked_payer_phone', '255*****5678')->assertJsonMissingPath('confirmation_email_sent')
            ->assertJsonMissingPath('confirmation_email');
        $this->postJson('/api/orders', $payload)->assertCreated()->assertJsonPath('id', $response->json('id'));
        $this->assertSame(98, Product::find('p1')->stock);
        $this->assertDatabaseCount('orders', 1);
        Http::assertSentCount(2);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'create-order-minimal') && $r['amount'] === '17272.00'
            && $r['buyer_phone'] === '255712345678' && $r['currency'] === 'TZS' && $r->hasHeader('Digest'));
        Http::assertSent(fn ($r) => str_contains($r->url(), 'wallet-payment') && $r['msisdn'] === '255712345678');
        Queue::assertPushed(SendOrderConfirmation::class, 1);
        $this->getJson('/api/orders')->assertJsonPath('0.delivery_option', 'delivery')->assertJsonPath('0.time_slot', 'Tomorrow')->assertJsonCount(1, '0.items');
    }

    public function test_invalid_phone_and_network_never_create_an_order(): void
    {
        foreach (['1234', '255812345678', '07123456789', 'abc', null] as $phone) {
            $payload = $this->payload();
            $payload['payerPhone'] = $phone;
            $this->postJson('/api/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('payerPhone');
        }
        $payload = $this->payload();
        $payload['paymentProvider'] = 'unknown';
        $this->postJson('/api/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('paymentProvider');
        $this->assertDatabaseCount('orders', 0);
        Http::assertNothingSent();
    }

    public function test_webhook_verifies_payment_and_replay_cannot_change_paid_timestamp(): void
    {
        $this->provider();
        $order = $this->checkout();
        $this->provider('COMPLETED');
        $payload = ['order_id' => $order->selcom_order_id, 'payment_status' => 'FAKE'];
        $this->postJson('/api/selcom/webhook', $payload)->assertOk();
        $paidAt = $order->fresh()->paid_at->toISOString();
        $this->travel(2)->minutes();
        $this->postJson('/api/selcom/webhook', $payload)->assertOk();
        $this->assertSame($paidAt, $order->fresh()->paid_at->toISOString());
        $this->assertSame('VERIFIED-REF', $order->fresh()->payment_reference);
        $this->provider('PENDING');
        $this->postJson('/api/selcom/webhook', $payload)->assertOk();
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertSame(98, Product::find('p1')->stock);
    }

    public function test_forged_webhooks_cannot_claim_payment_and_mismatched_status_fails_closed(): void
    {
        $this->provider();
        $order = $this->checkout();
        $this->postJson('/api/selcom/webhook', ['order_id' => $order->selcom_order_id, 'payment_status' => 'COMPLETED', 'amount' => '17272'])->assertOk();
        $this->assertSame('pending', $order->fresh()->payment_status);
        foreach ([['amount' => '1'], ['order_id' => 'OTHER'], ['currency' => 'USD'], ['reference' => null], ['amount' => '17272.001']] as $override) {
            $this->provider('COMPLETED', $override);
            $this->postJson('/api/selcom/webhook', ['order_id' => $order->selcom_order_id])->assertStatus(409);
            $this->assertNull($order->fresh()->paid_at);
        }
        $this->postJson('/api/selcom/webhook', ['order_id' => 'UNKNOWN'])->assertNotFound();
    }

    public function test_status_is_stored_only_and_owner_scoped(): void
    {
        $this->provider();
        $order = $this->checkout();
        $this->getJson('/api/orders/'.$order->id.'/payment-status')->assertOk()->assertJsonPath('payment_status', 'pending');
        Http::assertSentCount(2);
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/orders/'.$order->id.'/payment-status')->assertNotFound();
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0712345678'])->assertNotFound();
        Http::assertSentCount(2);
    }

    public function test_retry_is_throttled_and_pending_payment_cannot_trigger_a_second_charge(): void
    {
        $this->provider();
        $order = $this->checkout();
        $this->travel(50)->seconds();
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0712345678'])->assertUnprocessable();
        }
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0712345678'])->assertStatus(429);
        Http::assertSentCount(5); // Two checkout calls, three verification GETs only.
    }

    public function test_verified_expiry_creates_a_new_provider_attempt_without_new_stock_deductions(): void
    {
        $this->provider();
        $order = $this->checkout();
        $oldId = $order->selcom_order_id;
        $this->travel(50)->seconds();
        $this->provider('EXPIRED');
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'airtelmoney', 'phone' => '+255 712 345 678'])->assertOk();
        $this->assertNotSame($oldId, $order->fresh()->selcom_order_id);
        $this->assertDatabaseCount('payment_attempts', 2);
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame(98, Product::find('p1')->stock);
        $this->provider('COMPLETED');
        $this->postJson('/api/selcom/webhook', ['order_id' => $oldId])->assertOk();
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_verified_decline_can_resend_but_paid_orders_cannot(): void
    {
        $this->provider();
        $order = $this->checkout();
        $this->travel(50)->seconds();
        $this->provider('REJECTED');
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0712345678'])->assertOk();
        $this->assertDatabaseCount('payment_attempts', 1);
        $this->provider('COMPLETED');
        $this->postJson('/api/selcom/webhook', ['order_id' => $order->selcom_order_id])->assertOk();
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0712345678'])->assertUnprocessable();
    }

    public function test_timeout_keeps_saved_order_pending_and_reconciliation_recovers_it(): void
    {
        Http::fake(['*' => Http::failedConnection()]);
        $order = $this->checkout();
        $this->assertSame('pending', $order->payment_status);
        $this->assertNull($order->paid_at);
        $this->provider('COMPLETED');
        $this->artisan('selcom:reconcile')->assertSuccessful();
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_admin_cannot_override_selcom_verification_but_can_update_fulfilment(): void
    {
        $this->provider();
        $order = $this->checkout();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->patchJson('/api/admin/orders/'.$order->id, ['payment_status' => 'paid'])->assertUnprocessable();
        $this->patchJson('/api/admin/orders/'.$order->id, ['status' => 'processing'])->assertOk();
    }

    public function test_forgot_is_neutral_and_reset_uses_broker_token_and_spa_link(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $known = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $this->postJson('/api/forgot-password', ['email' => 'missing@example.test'])->assertOk()->assertExactJson($known->json());
        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user, &$token) {
            $token = $notification->token;
            $this->assertStringStartsWith('https://familychoiceminimarket.co.tz/reset-password?', $notification->toMail($user)->actionUrl);

            return true;
        });
        $payload = ['email' => $user->email, 'token' => $token, 'password' => 'newpassword123', 'password_confirmation' => 'newpassword123'];
        $this->postJson('/api/reset-password', [...$payload, 'token' => 'invalid'])->assertUnprocessable();
        $this->postJson('/api/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
        $this->postJson('/api/reset-password', $payload)->assertUnprocessable();
        $this->assertFalse(Password::tokenExists($user, $token));
    }

    public function test_confirmation_flags_are_hidden_until_actual_transport_dispatch(): void
    {
        $this->provider();
        $order = $this->checkout();
        config()->set('mail.default', 'log');
        (new SendOrderConfirmation($order->id))->handle();
        $this->assertArrayNotHasKey('confirmation_email_sent', $order->fresh()->toArray());
        config()->set('mail.default', 'smtp');
        Mail::shouldReceive('mailer->to->send')->once()->withArgs(fn ($mail) => $mail instanceof OrderConfirmation)
            ->andReturn(new SentMessage(new \Symfony\Component\Mailer\SentMessage(
                (new Email)->from('store@example.test')->to('customer@example.test')->text('Test'),
                new Envelope(new Address('store@example.test'), [new Address('customer@example.test')])
            )));
        (new SendOrderConfirmation($order->id))->handle();
        (new SendOrderConfirmation($order->id))->handle(); // No second send.
        $this->getJson('/api/orders')->assertJsonPath('0.confirmation_email_sent', true)->assertJsonPath('0.confirmation_email', User::find($order->user_id)->email);
    }

    public function test_failed_mail_does_not_set_confirmation_flags(): void
    {
        $this->provider();
        $order = $this->checkout();
        config()->set('mail.default', 'smtp');
        Mail::shouldReceive('mailer->to->send')->once()->andThrow(new \RuntimeException('Test transport failure'));
        try {
            (new SendOrderConfirmation($order->id))->handle();
            $this->fail('Mail failure should be retried by the queue.');
        } catch (\RuntimeException) {
            $this->assertNull($order->fresh()->confirmation_email_sent_at);
        }
    }

    public function test_new_spa_routes_serve_the_storefront(): void
    {
        foreach (['/track', '/forgot-password', '/reset-password?token=test&email=user@example.test'] as $url) {
            $response = $this->get($url)->assertOk();
            $this->assertInstanceOf(BinaryFileResponse::class, $response->baseResponse);
            $this->assertStringContainsString('<div id="root">', file_get_contents($response->baseResponse->getFile()->getPathname()));
        }
    }
}
