<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Covers the pos:products:import command against a fixture POS database on a
 * second (sqlite) connection, including its safety guards.
 */
class PosProductImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.connections.pos' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
        ]);
        DB::purge('pos');

        $pos = DB::connection('pos');
        $pos->statement('CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE,
            name TEXT,
            category TEXT,
            quantity_type TEXT,
            unit TEXT,
            selling_price INTEGER,
            image_path TEXT,
            image_width INTEGER,
            image_height INTEGER,
            is_active INTEGER DEFAULT 1,
            deleted_at TEXT,
            created_at TEXT,
            updated_at TEXT
        )');
        $pos->statement('CREATE TABLE product_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            qty_remaining_atoms INTEGER DEFAULT 0,
            is_quarantined INTEGER DEFAULT 0,
            is_recalled INTEGER DEFAULT 0,
            expiry_date TEXT
        )');
        $pos->statement('CREATE TABLE product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            path TEXT,
            width INTEGER,
            height INTEGER,
            alt_text TEXT,
            is_primary INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            deleted_at TEXT
        )');
        $pos->statement('CREATE TABLE sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            qty_atoms INTEGER DEFAULT 0
        )');
    }

    public function test_import_replaces_the_catalogue_with_mapped_pos_products(): void
    {
        $biscuits = $this->posProduct([
            'sku' => 'TST-0001',
            'name' => 'TST Biscuits',
            'category' => 'Snacks & Sweets',
            'quantity_type' => 'count',
            'unit' => 'each',
            'selling_price' => 2500,
            'image_path' => 'businesses/1/products/prod_a/abc.webp',
            'image_width' => 1000,
            'image_height' => 1000,
            'created_at' => '2026-10-21 08:00:00',
            'updated_at' => '2026-10-21 08:00:00',
        ]);
        $this->posBatch($biscuits, ['qty_remaining_atoms' => 7]);
        $this->posBatch($biscuits, ['qty_remaining_atoms' => 100, 'expiry_date' => '2020-01-01']);
        $this->posSale($biscuits, 3);
        DB::connection('pos')->table('product_images')->insert([
            'product_id' => $biscuits,
            'path' => 'businesses/1/products/prod_a/abc.webp',
            'width' => 1000,
            'height' => 1000,
            'alt_text' => 'Biscuit pack',
            'is_primary' => 1,
        ]);

        $sugar = $this->posProduct([
            'sku' => 'TST-0002',
            'name' => 'Sukari (kg)',
            'category' => 'Dairy & Chilled',
            'quantity_type' => 'weight',
            'unit' => 'kg',
            'selling_price' => 3800,
            'created_at' => '2026-10-24 09:00:00',
            'updated_at' => '2026-10-24 09:00:00',
        ]);
        $this->posBatch($sugar, ['qty_remaining_atoms' => 19000]);
        $this->posBatch($sugar, ['qty_remaining_atoms' => 5000, 'is_quarantined' => 1]);
        $this->posBatch($sugar, ['qty_remaining_atoms' => 2000, 'is_recalled' => 1]);

        $this->posProduct(['sku' => 'TST-0003', 'name' => 'Retired', 'category' => 'Pantry & Staples', 'is_active' => 0]);

        Product::create(['id' => 'OLD-001', 'details' => ['name' => 'Seeded'], 'price_cents' => 900, 'stock' => 5]);

        $this->artisan('pos:products:import', ['--skip-images' => true])->assertSuccessful();

        $this->assertSame(2, Product::count());
        $this->assertNull(Product::find('OLD-001'));
        $this->assertNull(Product::find('TST-0003'));

        $biscuit = Product::findOrFail('TST-0001');
        $this->assertSame(250000, $biscuit->price_cents);
        $this->assertSame(7, $biscuit->stock);
        $this->assertSame('snacks', $biscuit->details['categoryId']);
        $this->assertSame('1 piece', $biscuit->details['unit']);
        $this->assertSame('Biscuit pack', $biscuit->details['imageAlt']);
        $this->assertSame(['bestseller', 'new'], $biscuit->details['tags']);
        $this->assertSame('confirmed', $biscuit->details['stockStatus']);
        $this->assertTrue($biscuit->details['orderable']);
        $this->assertSame('store-confirmed', $biscuit->details['priceType']);
        $this->assertSame('TST Biscuits · 1 piece', $biscuit->details['description']);
        $this->assertSame(1000, $biscuit->details['imageWidth']);
        $this->assertSame('2026-10-21 08:00:00', $biscuit->created_at->format('Y-m-d H:i:s'));

        $sugarRow = Product::findOrFail('TST-0002');
        $this->assertSame(380000, $sugarRow->price_cents);
        $this->assertSame(19, $sugarRow->stock);
        $this->assertSame('dairy', $sugarRow->details['categoryId']);
        $this->assertSame('1 kg', $sugarRow->details['unit']);
        $this->assertSame('Sukari (kg) — 1 kg', $sugarRow->details['imageAlt']);
        $this->assertSame(['new'], $sugarRow->details['tags']);
        $this->assertSame('2026-10-24 09:00:00', $sugarRow->created_at->format('Y-m-d H:i:s'));

        $this->getJson('/api/products')->assertOk()->assertJsonCount(2);
    }

    public function test_import_refuses_an_unmapped_pos_category(): void
    {
        $this->posProduct(['sku' => 'TST-0010', 'name' => 'Mystery', 'category' => 'Mystery Aisle']);
        Product::create(['id' => 'OLD-001', 'details' => ['name' => 'Seeded'], 'price_cents' => 900, 'stock' => 5]);

        $this->artisan('pos:products:import', ['--skip-images' => true])->assertFailed();

        $this->assertSame(1, Product::count());
        $this->assertNotNull(Product::find('OLD-001'));
        $this->assertNull(Product::find('TST-0010'));
    }

    public function test_import_refuses_to_remove_products_referenced_by_order_history(): void
    {
        $this->posProduct(['sku' => 'TST-0001', 'name' => 'TST Biscuits', 'category' => 'Snacks & Sweets', 'unit' => 'each']);
        Product::create(['id' => 'OLD-001', 'details' => ['name' => 'Ordered before'], 'price_cents' => 900, 'stock' => 5]);

        $orderId = DB::table('orders')->insertGetId([
            'user_id' => User::factory()->create()->id,
            'request_id' => (string) Str::uuid(),
            'number' => 'FC-'.Str::upper(Str::random(8)),
            'delivery' => json_encode(['name' => 'Customer', 'phone' => '+255700000000']),
            'delivery_option' => 'pickup',
            'time_slot' => 'Tomorrow',
            'subtotal_cents' => 900,
            'delivery_cents' => 0,
            'tax_cents' => 0,
            'total_cents' => 900,
        ]);
        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_id' => 'OLD-001',
            'name' => 'Ordered before',
            'image' => '',
            'quantity' => 1,
            'price_cents' => 900,
        ]);

        $this->artisan('pos:products:import', ['--skip-images' => true])->assertFailed();

        $this->assertSame(1, Product::count());
        $this->assertNotNull(Product::find('OLD-001'));
        $this->assertNull(Product::find('TST-0001'));
    }

    public function test_dry_run_reports_without_changing_the_catalogue(): void
    {
        $this->posProduct(['sku' => 'TST-0001', 'name' => 'TST Biscuits', 'category' => 'Snacks & Sweets', 'unit' => 'each']);
        Product::create(['id' => 'OLD-001', 'details' => ['name' => 'Seeded'], 'price_cents' => 900, 'stock' => 5]);

        $this->artisan('pos:products:import', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(1, Product::count());
        $this->assertNotNull(Product::find('OLD-001'));
        $this->assertNull(Product::find('TST-0001'));
    }

    private function posProduct(array $attributes): int
    {
        return (int) DB::connection('pos')->table('products')->insertGetId(array_merge([
            'sku' => 'TST-'.Str::padLeft((string) DB::connection('pos')->table('products')->count(), 4, '0'),
            'name' => 'Fixture product',
            'category' => 'Pantry & Staples',
            'quantity_type' => 'count',
            'unit' => 'piece',
            'selling_price' => 1500,
            'is_active' => 1,
            'created_at' => '2026-10-22 10:00:00',
            'updated_at' => '2026-10-22 10:00:00',
        ], $attributes));
    }

    private function posBatch(int $productId, array $attributes): void
    {
        DB::connection('pos')->table('product_batches')->insert(array_merge([
            'product_id' => $productId,
            'qty_remaining_atoms' => 0,
            'is_quarantined' => 0,
            'is_recalled' => 0,
            'expiry_date' => null,
        ], $attributes));
    }

    private function posSale(int $productId, int $atoms): void
    {
        DB::connection('pos')->table('sale_items')->insert([
            'product_id' => $productId,
            'qty_atoms' => $atoms,
        ]);
    }
}
