<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_catalogue_omits_internal_notes_and_preserves_shopping_fields(): void
    {
        $this->artisan('freshcart:products:import', ['path' => 'database/catalog/family-choice-products.json'])->assertSuccessful();
        $response = $this->getJson('/api/products')->assertOk()->assertJsonCount(247);
        foreach ($response->json() as $item) {
            $expected = Product::findOrFail($item['id'])->storefront();
            $this->assertArrayNotHasKey('priceProvenance', $item);
            $this->assertArrayNotHasKey('availabilitySource', $item);
            foreach (['name', 'price', 'image', 'inStock', 'stock', 'stockStatus', 'orderable', 'categoryId', 'unit'] as $field) {
                $this->assertEquals($expected[$field], $item[$field]);
            }
        }
    }

    public function test_import_is_complete_idempotent_and_preserves_confirmed_inventory(): void
    {
        $path = 'database/catalog/family-choice-products.json';
        $this->artisan('freshcart:products:import', ['path' => $path])->assertSuccessful();
        $this->assertSame(247, Product::count());
        $this->getJson('/api/products')->assertOk()->assertJsonCount(247)->assertJsonFragment(['stock' => null, 'stockStatus' => 'available', 'orderable' => true, 'inStock' => true]);
        $p = Product::findOrFail('FC-056');
        $this->assertContains('FC-058', $p->details['sourceIds']);
        $this->assertNull(Product::find('FC-058'));
        foreach (Product::all() as $product) {
            $this->assertStringEndsWith('.webp', $product->details['image']);
            $this->assertGreaterThan(0, $product->price_cents);
            $this->assertSame('store-confirmed', $product->details['priceType']);
        }
        $p->update(['stock' => 12, 'price_cents' => 1234500, 'details' => array_merge($p->details, ['stockStatus' => 'confirmed', 'orderable' => true])]);
        $this->artisan('freshcart:products:import', ['path' => $path])->assertSuccessful();
        $this->assertSame(247, Product::count());
        $this->assertSame(12, $p->fresh()->stock);
        $this->assertSame(1234500, $p->fresh()->price_cents);
        $this->assertTrue($p->fresh()->details['orderable']);
    }

    public function test_unknown_inventory_cannot_create_an_order_or_take_payment(): void
    {
        $this->artisan('freshcart:products:import', ['path' => 'database/catalog/family-choice-products.json'])->assertSuccessful();
        $product = Product::findOrFail('FC-001');
        $product->update(['details' => array_merge($product->details, ['stockStatus' => 'unverified', 'orderable' => false])]);
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/orders', ['requestId' => (string) Str::uuid(), 'items' => [['productId' => 'FC-001', 'quantity' => 1]], 'delivery' => ['name' => 'Customer', 'phone' => '+255700000000', 'address' => 'Street', 'city' => 'Dar es Salaam'], 'deliveryOption' => 'pickup', 'timeSlot' => 'Tomorrow', 'paymentMethod' => 'cash'])->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(0, Product::findOrFail('FC-001')->stock);
    }

    public function test_owner_confirmed_availability_supports_checkout_without_inventing_counts(): void
    {
        $this->artisan('freshcart:products:import', ['path' => 'database/catalog/family-choice-products.json'])->assertSuccessful();
        $this->actingAs(User::factory()->create());
        $order = $this->postJson('/api/orders', ['requestId' => (string) Str::uuid(), 'items' => [['productId' => 'FC-001', 'quantity' => 2]], 'delivery' => ['name' => 'Customer', 'phone' => '+255700000000', 'address' => 'Street', 'city' => 'Dar es Salaam'], 'deliveryOption' => 'pickup', 'timeSlot' => 'Tomorrow', 'paymentMethod' => 'cash'])->assertCreated()->assertJsonPath('subtotal_cents', 500000)->json('id');
        $this->assertSame(0, Product::findOrFail('FC-001')->stock);
        $product = Product::findOrFail('FC-001');
        $product->update(['stock' => 10, 'details' => array_merge($product->details, ['stockStatus' => 'confirmed'])]);
        $this->postJson('/api/orders/'.$order.'/cancel')->assertOk();
        $this->assertSame(10, $product->fresh()->stock);
    }
}
