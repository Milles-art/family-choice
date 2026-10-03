<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function payload(): array
    {
        return ['requestId' => (string) Str::uuid(), 'items' => [['productId' => 'p1', 'quantity' => 2]], 'delivery' => ['name' => 'Test Customer', 'phone' => '+255700000000', 'address' => 'Test Street', 'city' => 'Test City'], 'deliveryOption' => 'delivery', 'timeSlot' => 'Tomorrow, 10:00 AM - 12:00 PM', 'paymentMethod' => 'cash'];
    }

    public function test_catalog_comes_from_database(): void
    {
        $this->getJson('/api/products')->assertOk()->assertJsonCount(39)->assertJsonPath('0.price', 1.99);
    }

    public function test_registration_sign_in_and_logout(): void
    {
        $this->postJson('/api/register', ['name' => 'Customer', 'email' => 'customer@example.test', 'password' => 'password123'])->assertCreated()->assertJsonMissingPath('password')->assertJsonPath('is_admin', false);
        $this->getJson('/api/me')->assertOk();
        $this->postJson('/api/logout')->assertNoContent();
        $this->postJson('/api/login', ['email' => 'customer@example.test', 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'customer@example.test', 'password' => 'password123'])->assertOk();
    }

    public function test_checkout_requires_sign_in(): void
    {
        $this->postJson('/api/orders', $this->payload())->assertUnauthorized();
    }

    public function test_checkout_uses_server_prices_and_persists_order(): void
    {
        $u = User::factory()->create();
        $d = $this->payload();
        $d['total_cents'] = 1;
        $d['items'][0]['price'] = 0;
        $this->actingAs($u)->postJson('/api/orders', $d)->assertCreated()->assertJsonPath('subtotal_cents', 398)->assertJsonPath('tax_cents', 32)->assertJsonPath('total_cents', 829)->assertJsonPath('payment_status', 'unpaid');
        $this->assertEquals(98, Product::find('p1')->stock);
        $this->getJson('/api/orders')->assertJsonCount(1)->assertJsonPath('0.items.0.quantity', 2);
    }

    public function test_retry_does_not_duplicate_orders_or_reduce_stock_twice(): void
    {
        $this->actingAs(User::factory()->create());
        $d = $this->payload();
        $a = $this->postJson('/api/orders', $d)->assertCreated();
        $b = $this->postJson('/api/orders', $d)->assertCreated();
        $this->assertEquals($a->json('id'), $b->json('id'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertEquals(98, Product::find('p1')->stock);
    }

    public function test_pickup_has_no_delivery_charge(): void
    {
        $d = $this->payload();
        $d['deliveryOption'] = 'pickup';
        $this->actingAs(User::factory()->create())->postJson('/api/orders', $d)->assertCreated()->assertJsonPath('delivery_cents', 0)->assertJsonPath('total_cents', 430);
    }

    public function test_insufficient_stock_rolls_back_whole_order(): void
    {
        Product::find('p2')->update(['stock' => 0]);
        $d = $this->payload();
        $d['items'][] = ['productId' => 'p2', 'quantity' => 1];
        $this->actingAs(User::factory()->create())->postJson('/api/orders', $d)->assertUnprocessable();
        $this->assertEquals(100, Product::find('p1')->stock);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_order_validation_and_unsupported_payment(): void
    {
        $this->actingAs(User::factory()->create());
        $d = $this->payload();
        $d['paymentMethod'] = 'card';
        $this->postJson('/api/orders', $d)->assertUnprocessable();
        $d = $this->payload();
        $d['items'][0]['quantity'] = -1;
        $this->postJson('/api/orders', $d)->assertUnprocessable();
    }

    public function test_customer_cannot_see_others_orders_or_manage_store(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/orders', $this->payload())->assertCreated();
        $this->actingAs(User::factory()->create())->getJson('/api/orders')->assertJsonCount(0);
        $this->getJson('/api/admin/orders')->assertForbidden();
        $this->patchJson('/api/admin/products/p1', ['stock' => 200])->assertForbidden();
    }

    public function test_admin_can_update_products_and_orders(): void
    {
        $u = User::factory()->create();
        $u->forceFill(['is_admin' => true])->save();
        $this->actingAs($u);
        $this->patchJson('/api/admin/products/p1', ['price_cents' => 250, 'stock' => 10])->assertOk()->assertJsonPath('price', 2.5);
        $o = $this->postJson('/api/orders', $this->payload())->assertCreated();
        $this->getJson('/api/admin/orders')->assertJsonCount(1);
        $this->patchJson('/api/admin/orders/'.$o->json('id'), ['status' => 'delivered', 'payment_status' => 'paid'])->assertOk()->assertJsonPath('status','delivered');
    }
}
