<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderPayments;
use App\Services\OrderCancellation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class HardeningTest extends TestCase
{
    use RefreshDatabase, \Tests\CreatesTestProducts;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createTestProducts();
        Queue::fake(); Mail::fake(); Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
    }

    private function payload(): array
    {
        return ['requestId' => (string) Str::uuid(), 'items' => [['productId' => 'p1', 'quantity' => 2]], 'delivery' => ['name' => 'Test', 'phone' => '0700000000', 'address' => 'Street', 'city' => 'City'], 'deliveryOption' => 'delivery', 'timeSlot' => 'Tomorrow', 'paymentMethod' => 'cash'];
    }

    private function order(): Order
    {
        $id = $this->postJson('/api/orders', $this->payload())->assertCreated()->json('id');
        return Order::findOrFail($id);
    }

    private function selcom(Order $order, string $status = 'PENDING'): PaymentAttempt
    {
        config()->set('services.selcom', ['enabled' => true, 'base_url' => 'https://provider.example.test', 'vendor' => 'TEST', 'api_key' => 'test', 'api_secret' => 'test', 'reconcile_hours' => 48]);
        config()->set('app.url', 'https://store.example.test');
        $order->update(['payment_method' => 'selcom', 'payment_status' => 'pending', 'selcom_order_id' => 'TEST-'.$order->id]);
        $attempt = PaymentAttempt::create(['order_id' => $order->id, 'selcom_order_id' => $order->selcom_order_id]);
        Http::fake(['*' => Http::response(['resultcode' => '000', 'result' => 'SUCCESS', 'data' => [['order_id' => $attempt->selcom_order_id, 'amount' => $order->total_cents / 100, 'currency' => 'TZS', 'payment_status' => $status, 'reference' => 'test-ref', 'transid' => 'test-tx']]])]);
        return $attempt;
    }

    public function test_customer_cancel_restores_once_and_cannot_reopen(): void
    {
        $order = $this->order();
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertOk()->assertJsonPath('status', 'cancelled');
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertOk();
        $this->assertSame(100, Product::find('p1')->stock);
        $this->assertNotNull($order->fresh()->stock_restored_at);
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->patchJson('/api/admin/orders/'.$order->id, ['status' => 'pending'])->assertUnprocessable();
    }

    public function test_paid_delivered_and_nonpending_customer_orders_cannot_cancel(): void
    {
        $order = $this->order();
        foreach ([['payment_status' => 'paid'], ['payment_status' => 'unpaid', 'status' => 'delivered'], ['status' => 'processing']] as $changes) {
            $order->update($changes);
            $this->postJson('/api/orders/'.$order->id.'/cancel')->assertUnprocessable();
        }
        $this->assertSame(98, Product::find('p1')->stock);
    }

    public function test_cancel_is_owner_only_and_throttled(): void
    {
        $order = $this->order();
        $owner = auth()->user();
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertNotFound();
        $this->actingAs($owner);
        for ($i = 0; $i < 3; $i++) $this->postJson('/api/orders/'.$order->id.'/cancel')->assertOk();
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertStatus(429);
    }

    public function test_admin_cancel_restores_stock(): void
    {
        $order = $this->order();
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->patchJson('/api/admin/orders/'.$order->id, ['status' => 'cancelled'])->assertOk();
        $this->assertSame(100, Product::find('p1')->stock);
    }

    public function test_admin_paid_selcom_refusal_keeps_verified_payment(): void
    {
        $order = $this->order(); $this->selcom($order, 'PAID');
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->patchJson('/api/admin/orders/'.$order->id, ['status' => 'cancelled'])->assertUnprocessable();
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertSame(98, Product::find('p1')->stock);
    }

    public function test_selcom_unknown_or_unavailable_never_cancels(): void
    {
        $order = $this->order();
        $this->selcom($order, 'UNKNOWN');
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertUnprocessable();
        Http::fake(['*' => Http::failedConnection()]);
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertUnprocessable();
        $this->assertSame('pending', $order->fresh()->status);
        $this->assertSame(98, Product::find('p1')->stock);
    }

    public function test_verified_paid_cancellation_refusal_preserves_payment(): void
    {
        $order = $this->order(); $this->selcom($order, 'PAID');
        $this->postJson('/api/orders/'.$order->id.'/cancel')->assertUnprocessable();
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_late_payment_flags_admin_and_does_not_restock_twice(): void
    {
        $order = $this->order();
        app(OrderCancellation::class)->cancel($order, 'Test');
        $attempt = $this->selcom($order, 'PAID');
        app(OrderPayments::class)->verify($attempt);
        app(OrderPayments::class)->verify($attempt->fresh());
        $this->assertSame(100, Product::find('p1')->stock);
        $this->assertSame('Paid after cancellation: staff review/refund needed', $order->fresh()->payment_message);
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->getJson('/api/admin/orders')->assertJsonPath('0.needs_review', true);
        $this->actingAs(User::find($order->user_id));
        $this->postJson('/api/orders/'.$order->id.'/payment/retry', ['network' => 'mpesa', 'phone' => '0700000000'])->assertUnprocessable();
        try { app(OrderPayments::class)->initiate($order->fresh(), 'mpesa', '255700000000'); $this->fail('Cancelled initiate accepted'); }
        catch (ValidationException) { $this->assertTrue(true); }
    }

    public function test_expiry_checks_provider_and_leaves_cash_disabled(): void
    {
        $order = $this->order(); $this->selcom($order, 'EXPIRED');
        $order->forceFill(['created_at' => now()->subHour()])->save();
        $this->artisan('orders:expire-unpaid')->assertSuccessful();
        $this->assertSame('cancelled', $order->fresh()->status);
        $cash = $this->order(); $cash->forceFill(['created_at' => now()->subDays(2)])->save();
        $this->artisan('orders:expire-unpaid')->assertSuccessful();
        $this->assertSame('pending', $cash->fresh()->status);
        config()->set('store.unconfirmed_order_hours', 24);
        $this->artisan('orders:expire-unpaid')->assertSuccessful();
        $this->assertSame('cancelled', $cash->fresh()->status);
    }

    public function test_expiry_skips_unavailable_verification(): void
    {
        $order = $this->order(); $this->selcom($order); $order->forceFill(['created_at' => now()->subHour()])->save();
        Http::fake(['*' => Http::failedConnection()]);
        $this->artisan('orders:expire-unpaid')->assertSuccessful();
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_open_order_limit_keeps_idempotent_retries(): void
    {
        $payload = $this->payload();
        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->order(); $this->order();
        $this->postJson('/api/orders', $this->payload())->assertUnprocessable()->assertJsonValidationErrors('orders');
        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->assertSame(94, Product::find('p1')->stock);
    }

    public function test_reconcile_age_bands_and_stop_are_bounded(): void
    {
        $this->freezeTime();
        $order = $this->order(); $attempt = $this->selcom($order);
        foreach ([[5, 0, 0], [5, 1, 1], [30, 9, 0], [30, 10, 1], [400, 59, 0], [400, 60, 1]] as [$age, $checkedAgo, $expected]) {
            $attempt->forceFill(['created_at' => now()->subMinutes($age), 'last_checked_at' => now()->subMinutes($checkedAgo)])->save();
            $this->artisan('selcom:reconcile')->expectsOutput('Checked '.$expected.' outstanding payment attempts.')->assertSuccessful();
        }
        $attempt->forceFill(['created_at' => now()->subHours(49), 'last_checked_at' => null])->save();
        Log::spy();
        $this->artisan('selcom:reconcile')->assertSuccessful();
        $this->artisan('selcom:reconcile')->assertSuccessful();
        Log::shouldHaveReceived('warning')->once()->with('Payment reconciliation stopped; staff review needed', ['order_id' => $order->id]);
        $order->update(['status' => 'cancelled']);
        $this->artisan('selcom:reconcile')->expectsOutput('Checked 0 outstanding payment attempts.')->assertSuccessful();
        $order->update(['status' => 'pending', 'payment_status' => 'paid']);
        $this->artisan('selcom:reconcile')->expectsOutput('Checked 0 outstanding payment attempts.')->assertSuccessful();
    }

    public function test_unverified_admin_and_ip_restriction_and_throttle(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'email_verified_at' => null]);
        $this->actingAs($admin)->getJson('/api/admin/orders')->assertForbidden();
        $admin->forceFill(['email_verified_at' => now()])->save();
        config()->set('store.admin_allowed_ips', ['192.0.2.1']);
        $this->getJson('/api/admin/orders')->assertForbidden();
        config()->set('store.admin_allowed_ips', []);
        for ($i = 0; $i < 58; $i++) $this->getJson('/api/admin/orders')->assertOk();
        $this->getJson('/api/admin/orders')->assertStatus(429);
    }

    public function test_admin_creation_and_promotion_are_explicit(): void
    {
        $this->artisan('freshcart:admin:create owner@example.test Owner')->expectsQuestion('Password (minimum 14 characters)', 'long-unique-test-password')->assertSuccessful();
        $owner = User::where('email', 'owner@example.test')->firstOrFail();
        $this->assertTrue($owner->is_admin); $this->assertNotNull($owner->email_verified_at);
        $this->artisan('freshcart:admin:create short@example.test Short')->expectsQuestion('Password (minimum 14 characters)', 'short')->assertFailed();
        $this->artisan('freshcart:admin '.auth()->user()->email)->assertFailed();
        $this->artisan('freshcart:admin '.auth()->user()->email.' --existing')->expectsConfirmation('Have you verified this account belongs to the intended administrator?', 'no')->assertFailed();
    }

    public function test_settings_whitelist_and_fillable_models(): void
    {
        config()->set('store.private_secret', 'never-public');
        $this->getJson('/api/settings')->assertOk()->assertJsonMissingPath('private_secret')->assertJsonMissingPath('admin_allowed_ips');
        foreach ([new Order, new Product, new PaymentAttempt, new \App\Models\OrderItem] as $model) {
            $this->assertFalse($model->isFillable('unexpected_field'));
        }
    }

    public function test_security_headers_modes_and_secure_only_hsts(): void
    {
        foreach (['off', 'report-only', 'enforce'] as $mode) {
            config()->set('store.csp_mode', $mode);
            $response = $this->getJson('/api/settings')->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
            if ($mode === 'off') $response->assertHeaderMissing('Content-Security-Policy-Report-Only')->assertHeaderMissing('Content-Security-Policy');
            else $response->assertHeader($mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only');
        }
        config()->set('store.hsts', true);
        $this->getJson('http://localhost/api/settings')->assertHeaderMissing('Strict-Transport-Security');
        $this->getJson('https://store.example.test/api/settings')->assertHeader('Strict-Transport-Security', 'max-age=15552000');
        config()->set('store.hsts', false);
        $this->getJson('https://store.example.test/api/settings')->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_breach_lookup_rejects_matches_and_fails_open(): void
    {
        $verifier = app(\Illuminate\Contracts\Validation\UncompromisedVerifier::class);
        $hash = strtoupper(sha1('synthetic-password'));
        Http::fake(['*' => Http::response(substr($hash, 5).':2')]);
        $this->assertFalse($verifier->verify(['value' => 'synthetic-password', 'threshold' => 0]));
        Http::assertSent(fn ($request) => str_ends_with($request->url(), substr($hash, 0, 5)) && !str_contains($request->url(), 'synthetic-password'));
        Http::fake(['*' => Http::failedConnection()]);
        $this->assertTrue($verifier->verify(['value' => 'synthetic-password', 'threshold' => 0]));
        Http::fake(['*' => Http::response('', 503)]);
        $this->assertTrue($verifier->verify(['value' => 'synthetic-password', 'threshold' => 0]));
    }

    public function test_trusted_proxy_buckets_and_https_and_spoof_protection(): void
    {
        \Illuminate\Support\Facades\Route::get('/api/test-ip', fn (\Illuminate\Http\Request $r) => ['ip' => $r->ip(), 'secure' => $r->isSecure()]);
        config()->set('store.trusted_proxies', '127.0.0.1');
        $this->withHeaders(['X-Forwarded-For' => '192.0.2.10', 'X-Forwarded-Proto' => 'https'])->getJson('/api/test-ip')->assertJsonPath('ip', '192.0.2.10')->assertJsonPath('secure', true);
        for ($i = 0; $i < 5; $i++) $this->postJson('/api/forgot-password', ['email' => 'none@example.test'])->assertOk();
        $this->postJson('/api/forgot-password', ['email' => 'none@example.test'])->assertStatus(429);
        $this->withHeaders(['X-Forwarded-For' => '192.0.2.11'])->postJson('/api/forgot-password', ['email' => 'none@example.test'])->assertOk();
        for ($i = 0; $i < 10; $i++) $this->postJson('/api/login', ['email' => 'proxy-login@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'proxy-login@example.test', 'password' => 'incorrect'])->assertStatus(429);
        $this->withHeaders(['X-Forwarded-For' => '192.0.2.12'])->postJson('/api/login', ['email' => 'proxy-login@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        for ($i = 0; $i < 60; $i++) $this->postJson('/api/selcom/webhook', ['order_id' => 'none'])->assertStatus(503);
        $this->postJson('/api/selcom/webhook', ['order_id' => 'none'])->assertStatus(429);
        $this->withHeaders(['X-Forwarded-For' => '192.0.2.13'])->postJson('/api/selcom/webhook', ['order_id' => 'none'])->assertStatus(503);
        config()->set('store.trusted_proxies', '');
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.12', 'X-Forwarded-Proto' => 'https'])->getJson('http://localhost/api/test-ip')->assertJsonPath('ip', '127.0.0.1')->assertJsonPath('secure', false);
    }

    public function test_login_email_buckets_are_case_insensitive_and_ip_limit_is_separate(): void
    {
        $this->app['auth']->forgetGuards();
        for ($i = 0; $i < 10; $i++) $this->postJson('/api/login', ['email' => 'absent@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'ABSENT@example.test', 'password' => 'incorrect'])->assertStatus(429);
        $this->postJson('/api/login', ['email' => 'different@example.test', 'password' => 'incorrect'])->assertUnprocessable();
    }

    public function test_production_registration_applies_breach_rule_and_fails_open(): void
    {
        $this->app['env'] = 'production';
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $password = 'synthetic-password';
        $hash = strtoupper(sha1($password));
        Http::fake(['*' => Http::response(substr($hash, 5).':100')]);
        $payload = ['name' => 'Customer', 'email' => 'fresh@example.test', 'password' => $password, 'privacyConsent' => true];
        $this->postJson('/api/register', $payload)->assertUnprocessable()->assertJsonValidationErrors('password');
        Http::fake(['*' => Http::failedConnection()]);
        $this->postJson('/api/register', $payload)->assertCreated();
    }

    public function test_preflight_is_readonly_and_reports_host_infrastructure(): void
    {
        $before = User::count();
        $this->artisan('store:preflight')->expectsOutput('Run a queue worker and scheduler; confirm their health on the host.')->assertFailed();
        $this->assertSame($before, User::count());
    }

    public function test_registration_limiter_and_safe_templates_and_schedule(): void
    {
        for ($i = 0; $i < 5; $i++) $this->postJson('/api/register', ['email' => 'rate@example.test'])->assertUnprocessable();
        $this->postJson('/api/register', ['email' => 'RATE@example.test'])->assertStatus(429);
        $this->postJson('/api/register', ['email' => 'other-rate@example.test'])->assertUnprocessable();
        $this->assertStringStartsWith('# LOCAL DEVELOPMENT ONLY.', file_get_contents(base_path('.env.example')));
        $production = file_get_contents(base_path('.env.production.example'));
        foreach (['APP_ENV=production', 'APP_DEBUG=false', 'LOG_LEVEL=warning', 'DB_PASSWORD=', 'QUEUE_CONNECTION=database', 'SESSION_SECURE_COOKIE=true'] as $setting) $this->assertStringContainsString($setting, $production);
        $static = file_get_contents(public_path('.htaccess'));
        foreach (['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'] as $header) $this->assertStringContainsString($header, $static);
        $this->assertStringContainsString('const RESEND_S = 45;', file_get_contents(base_path('../src/components/PaymentWaiting.tsx')));
        $events = app(\Illuminate\Console\Scheduling\Schedule::class)->events();
        $expiry = collect($events)->first(fn ($event) => str_contains($event->command ?? '', 'orders:expire-unpaid'));
        $this->assertNotNull($expiry); $this->assertTrue($expiry->withoutOverlapping); $this->assertSame('*/5 * * * *', $expiry->expression);
    }
}
