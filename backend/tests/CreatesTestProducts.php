<?php

namespace Tests;

use App\Models\Product;

trait CreatesTestProducts
{
    private function createTestProducts(): void
    {
        if (!app()->environment('testing')) {
            throw new \RuntimeException('Test fixtures require the testing environment.');
        }
        foreach (['p1', 'p2'] as $id) {
            Product::create([
                'id' => $id,
                'details' => ['id' => $id, 'name' => 'Automated test item '.$id,
                    'categoryId' => 'pantry', 'unit' => 'each', 'image' => '',
                    'description' => 'Synthetic test fixture', 'tags' => []],
                'price_cents' => 520000,
                'stock' => 100,
            ]);
        }
    }
}
