<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Keeps the storefront catalogue in step with the live BiziSmart POS.
 *
 * Reads every active product from the POS database (a second connection,
 * configured with POS_DB_* credentials), transforms it into the storefront
 * row shape that Product::storefront() already renders, refreshes the product
 * image files under public/images/products, and replaces the catalogue in one
 * transaction. The POS remains the single source of truth: rerun the command
 * whenever products, prices or stock change on the till.
 */
class ImportPosProducts extends Command
{
    protected $signature = 'pos:products:import
                            {--skip-images : Leave the product image files untouched}
                            {--dry-run : Read and report without writing rows or files}';

    protected $description = 'Replace the storefront catalogue with the live BiziSmart POS product list';

    /**
     * POS category => storefront category id. Keep in step with src/data.ts
     * (categories) and backend/resources/seo/site.json (categories).
     */
    private const CATEGORY_MAP = [
        'Fresh Produce' => 'produce',
        'Dairy & Chilled' => 'dairy',
        'Drinks & Water' => 'beverages',
        'Pantry & Staples' => 'pantry',
        'Household Essentials' => 'household',
        'Personal Care' => 'personal-care',
        'Snacks & Sweets' => 'snacks',
        'General Merchandise' => 'general',
    ];

    /** Counted POS units that read better on a product card. */
    private const UNIT_ALIASES = ['each' => 'piece'];

    /** Newest products carried into the New Arrivals page (which shows twelve). */
    private const NEW_ARRIVALS = 12;

    private int $imagesPlaced = 0;
    private int $imagesFresh = 0;

    /** @var string[] */
    private array $imageWarnings = [];

    private ?string $imageMagick = null;
    private bool $imageMagickResolved = false;
    private bool $imageMagickWarned = false;
    private bool $dryRun = false;

    public function handle(): int
    {
        $this->dryRun = (bool) $this->option('dry-run');

        if (! config('database.connections.pos.database')) {
            $this->error('POS_DB_DATABASE is not configured. Add the POS credentials (POS_DB_*) to .env before importing.');

            return self::FAILURE;
        }

        try {
            $catalogue = $this->readPosCatalogue();
        } catch (\Throwable $error) {
            $this->error('Cannot read the POS catalogue: '.$error->getMessage());

            return self::FAILURE;
        }

        if ($catalogue === []) {
            $this->error('The POS reported no active products; refusing to empty the storefront.');

            return self::FAILURE;
        }

        $problems = $this->validate($catalogue);
        if ($problems !== []) {
            foreach (array_slice($problems, 0, 25) as $problem) $this->error($problem);
            if (count($problems) > 25) $this->error('...and '.(count($problems) - 25).' more problems.');

            return self::FAILURE;
        }

        $imageResults = $this->option('skip-images')
            ? $this->imagesOnDisk($catalogue)
            : $this->syncImages($catalogue);

        $rows = $this->transform($catalogue, $imageResults);
        $this->report($rows);

        if ($this->option('dry-run')) {
            $this->warn('Dry run: no rows or files were changed.');
            $this->line('Sample row: '.json_encode($rows[0]['details'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

            return self::SUCCESS;
        }

        if (! $this->confirmRemovals($rows)) return self::FAILURE;

        DB::transaction(function () use ($rows) {
            Product::whereNotIn('id', array_column($rows, 'id'))->delete();
            foreach ($rows as $data) {
                $product = Product::find($data['id']) ?? new Product(['id' => $data['id']]);
                $timestamps = [];
                if ($data['created_at'] !== null) $timestamps['created_at'] = Carbon::parse($data['created_at']);
                if ($data['updated_at'] !== null) $timestamps['updated_at'] = Carbon::parse($data['updated_at']);
                $product->forceFill([
                    'details' => $data['details'],
                    'price_cents' => $data['price_cents'],
                    'stock' => $data['stock'],
                ] + $timestamps)->save();
            }
        }, 3);

        $this->info('Catalogue replaced: '.count($rows).' products imported from the POS.');
        if (! $this->option('skip-images')) {
            $this->line('Images: '.$this->imagesPlaced.' written, '.$this->imagesFresh.' already current.');
            $this->printImageWarnings();
        }

        return self::SUCCESS;
    }

    /** @return array<int, array<string, mixed>> */
    private function readPosCatalogue(): array
    {
        $pos = DB::connection('pos');

        $bestSellers = $pos->table('sale_items as si')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->groupBy('p.id', 'p.sku')
            ->orderByRaw('SUM(si.qty_atoms) DESC')
            ->pluck('sku')
            ->flip();

        $gallery = [];
        $galleryRows = $pos->table('product_images')
            ->whereNull('deleted_at')
            ->orderByRaw('width DESC, is_primary DESC, sort_order ASC, id ASC')
            ->get(['product_id', 'path', 'width', 'height', 'alt_text']);
        foreach ($galleryRows as $image) {
            if (! isset($gallery[$image->product_id])) $gallery[$image->product_id] = $image;
        }

        $atomsByProduct = $pos->table('product_batches')
            ->where('is_quarantined', 0)
            ->where('is_recalled', 0)
            ->where(function ($query) {
                $query->whereNull('expiry_date')->orWhere('expiry_date', '>=', DB::raw('CURRENT_DATE'));
            })
            ->select('product_id', DB::raw('SUM(qty_remaining_atoms) as atoms'))
            ->groupBy('product_id');

        $products = $pos->table('products as p')
            ->leftJoinSub($atomsByProduct, 'b', function ($join) {
                $join->on('b.product_id', '=', 'p.id');
            })
            ->where('p.is_active', 1)
            ->whereNull('p.deleted_at')
            ->select('p.*', DB::raw('COALESCE(b.atoms, 0) as atoms'))
            ->orderBy('p.sku')
            ->get();

        $newest = $products
            ->sortBy([['created_at', 'desc'], ['sku', 'asc']])
            ->take(self::NEW_ARRIVALS)
            ->pluck('sku')
            ->flip();

        return $products->map(function ($row) use ($gallery, $bestSellers, $newest) {
            $image = $gallery[$row->id] ?? null;
            $width = $image->width ?? $row->image_width;
            $height = $image->height ?? $row->image_height;

            return [
                'id' => (string) $row->sku,
                'pos_id' => $row->id,
                'posCategory' => (string) $row->category,
                'name' => trim((string) $row->name),
                'quantityType' => (string) $row->quantity_type,
                'unit' => (string) $row->unit,
                'price' => (int) $row->selling_price,
                'atoms' => (int) $row->atoms,
                'image' => $image->path ?? $row->image_path,
                'imageAlt' => trim((string) ($image->alt_text ?? '')) ?: null,
                'imageWidth' => $width !== null ? (int) $width : null,
                'imageHeight' => $height !== null ? (int) $height : null,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
                'bestseller' => $bestSellers->has($row->sku),
                'new' => $newest->has($row->sku),
            ];
        })->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return string[]
     */
    private function validate(array $catalogue): array
    {
        $problems = [];
        $seen = [];
        foreach ($catalogue as $item) {
            $id = $item['id'];
            if ($id === '' || preg_match('/^[A-Za-z0-9_-]+$/', $id) !== 1) {
                $problems[] = 'POS SKU is not URL-safe: '.var_export($id, true);
            } elseif (isset($seen[$id])) {
                $problems[] = 'Duplicate POS SKU: '.$id;
            }
            $seen[$id] = true;

            if ($item['name'] === '') $problems[] = 'Product '.$id.' has no name.';
            if ($item['price'] < 1 || $item['price'] * 100 > 4294967295) {
                $problems[] = 'Product '.$id.' has a selling price outside the supported range: '.$item['price'].' TSh.';
            }
            if (! array_key_exists($item['posCategory'], self::CATEGORY_MAP)) {
                $problems[] = 'Uncategorised POS category for '.$id.': '.var_export($item['posCategory'], true)
                    .' — add it to ImportPosProducts::CATEGORY_MAP and to the storefront categories.';
            }
            if ($item['image'] !== null && (
                str_contains($item['image'], '..') || str_starts_with($item['image'], '/')
                || preg_match('/\.(webp|png|jpe?g)$/i', $item['image']) !== 1
            )) {
                $problems[] = 'Product '.$id.' has an unsafe image path: '.var_export($item['image'], true);
            }
        }

        return $problems;
    }

    /**
     * Copy the POS product images into public/images/products (plus the 480 and
     * 960 responsive variants the frontend rewrites URLs to). Idempotent: files
     * newer than their POS source are left alone.
     *
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array<string, array<string, mixed>>
     */
    private function syncImages(array $catalogue): array
    {
        $root = config('pos.image_source');
        if (! is_string($root) || $root === '' || ! is_dir($root)) {
            $this->warn('POS image source not found (POS_IMAGE_SOURCE); using whatever image files already exist.');
        }

        $target = public_path('images/products');
        if (! $this->dryRun) {
            File::ensureDirectoryExists($target.'/responsive/480');
            File::ensureDirectoryExists($target.'/responsive/960');
        }

        $results = [];
        foreach ($catalogue as $item) {
            $source = null;
            if (is_string($root) && is_dir($root) && is_string($item['image']) && $item['image'] !== '') {
                $candidate = $root.'/'.$item['image'];
                if (is_file($candidate)) $source = $candidate;
                else $this->imageWarnings[] = $item['id'].': POS source image missing ('.$item['image'].')';
            }

            $base = $item['id'].'.webp';
            if ($source !== null) {
                $this->place($source, $target.'/'.$base);
                $this->place($source, $target.'/responsive/480/'.$base, 480);
                $this->place($source, $target.'/responsive/960/'.$base, 960);
            }

            $main = $target.'/'.$base;
            $exists = is_file($main);
            if ($exists) [$width, $height] = $this->dimensions($main);
            elseif ($source !== null) [$width, $height] = $this->dimensions($source);
            else [$width, $height] = [$item['imageWidth'], $item['imageHeight']];
            $usable = $exists || ($this->dryRun && $source !== null);
            $results[$item['id']] = [
                'url' => $usable ? '/images/products/'.$base : '',
                'width' => $width ?: null,
                'height' => $height ?: null,
            ];
        }

        return $results;
    }

    /**
     * When image syncing is skipped, read the dimensions of the files already
     * in place so the catalogue rows stay accurate.
     *
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array<string, array<string, mixed>>
     */
    private function imagesOnDisk(array $catalogue): array
    {
        $results = [];
        foreach ($catalogue as $item) {
            $main = public_path('images/products/'.$item['id'].'.webp');
            $exists = is_file($main);
            [$width, $height] = $exists ? $this->dimensions($main) : [$item['imageWidth'], $item['imageHeight']];
            $results[$item['id']] = [
                'url' => $exists ? '/images/products/'.$item['id'].'.webp' : '',
                'width' => $width ?: null,
                'height' => $height ?: null,
            ];
        }

        return $results;
    }

    private function place(string $source, string $destination, ?int $maxWidth = null): void
    {
        $sourceTime = @filemtime($source);
        if (is_file($destination) && $sourceTime !== false && filemtime($destination) >= $sourceTime) {
            $this->imagesFresh++;

            return;
        }
        if ($this->dryRun) {
            $this->imagesPlaced++;

            return;
        }
        File::ensureDirectoryExists(dirname($destination));

        [$sourceWidth] = $this->dimensions($source);
        $needsWebp = strtolower(pathinfo($source, PATHINFO_EXTENSION)) !== 'webp';
        $magick = $this->imageMagick();
        $resize = $maxWidth !== null && $sourceWidth > $maxWidth;
        $useMagick = $magick !== null && ($needsWebp || $resize);

        if (! $useMagick) {
            if ($resize && ! $this->imageMagickWarned || $needsWebp && ! $this->imageMagickWarned) {
                $this->imageMagickWarned = true;
                $this->imageWarnings[] = 'ImageMagick is unavailable; images keep their original format and size.';
            }
            $this->copyImage($source, $destination);

            return;
        }

        $command = escapeshellarg($magick)
            .' '.escapeshellarg($source)
            .($resize ? ' -resize '.escapeshellarg($maxWidth.'x'.$maxWidth.'>') : '')
            .' -quality 82 '
            .escapeshellarg($destination);
        exec($command, $output, $exitCode);
        if ($exitCode === 0 && is_file($destination)) {
            $this->imagesPlaced++;

            return;
        }

        @unlink($destination);
        $this->imageWarnings[] = 'Conversion failed for '.basename($destination).'; using the source file instead.';
        $this->copyImage($source, $destination);
    }

    private function copyImage(string $source, string $destination): void
    {
        if (@copy($source, $destination)) {
            $this->imagesPlaced++;
        } else {
            $this->imageWarnings[] = 'Could not write '.$destination.'.';
        }
    }

    private function imageMagick(): ?string
    {
        if ($this->imageMagickResolved) return $this->imageMagick;
        $this->imageMagickResolved = true;
        if (! function_exists('exec')) return null;
        foreach (['magick', 'convert'] as $candidate) {
            $output = [];
            $exitCode = 1;
            exec('command -v '.escapeshellarg($candidate).' 2>/dev/null', $output, $exitCode);
            if ($exitCode === 0 && $output !== []) {
                $this->imageMagick = $candidate;

                return $this->imageMagick;
            }
        }

        return null;
    }

    /** @return array{0: int, 1: int} */
    private function dimensions(string $path): array
    {
        $size = @getimagesize($path);

        return is_array($size) ? [(int) $size[0], (int) $size[1]] : [0, 0];
    }

    /**
     * @param  array<int, array<string, mixed>>  $catalogue
     * @param  array<string, array<string, mixed>>  $imageResults
     * @return array<int, array<string, mixed>>
     */
    private function transform(array $catalogue, array $imageResults): array
    {
        $rows = [];
        foreach ($catalogue as $item) {
            $unitLabel = $item['quantityType'] === 'weight'
                ? '1 '.$item['unit']
                : '1 '.(self::UNIT_ALIASES[$item['unit']] ?? $item['unit']);
            $stock = $item['quantityType'] === 'weight' ? intdiv($item['atoms'], 1000) : $item['atoms'];

            $tags = [];
            if ($item['bestseller']) $tags[] = 'bestseller';
            if ($item['new']) $tags[] = 'new';

            $image = $imageResults[$item['id']];
            $details = [
                'id' => $item['id'],
                'name' => $item['name'],
                'categoryId' => self::CATEGORY_MAP[$item['posCategory']],
                'unit' => $unitLabel,
                'image' => $image['url'],
                'imageAlt' => $item['imageAlt'] ?? ($item['name'].' — '.$unitLabel),
                'price' => $item['price'],
                'priceType' => 'store-confirmed',
                'priceUnit' => $unitLabel,
                'priceNote' => '',
                'stockStatus' => 'confirmed',
                'orderable' => true,
                'rating' => 0,
                'reviews' => 0,
                'tags' => $tags,
                'description' => $item['name'].' · '.$unitLabel,
                'sourceIds' => [$item['id']],
            ];
            if ($image['width'] !== null) $details['imageWidth'] = $image['width'];
            if ($image['height'] !== null) $details['imageHeight'] = $image['height'];

            $rows[] = [
                'id' => $item['id'],
                'details' => $details,
                'price_cents' => $item['price'] * 100,
                'stock' => $stock,
                'created_at' => $item['created_at'],
                'updated_at' => $item['updated_at'],
            ];
        }

        return $rows;
    }

    /** @param  array<int, array<string, mixed>>  $rows */
    private function report(array $rows): void
    {
        $byCategory = [];
        $outOfStock = 0;
        $bestsellers = 0;
        $newArrivals = 0;
        $withoutImage = 0;
        foreach ($rows as $row) {
            $categoryId = $row['details']['categoryId'];
            $byCategory[$categoryId] = ($byCategory[$categoryId] ?? 0) + 1;
            if ($row['stock'] <= 0) $outOfStock++;
            if (in_array('bestseller', $row['details']['tags'], true)) $bestsellers++;
            if (in_array('new', $row['details']['tags'], true)) $newArrivals++;
            if ($row['details']['image'] === '') $withoutImage++;
        }
        ksort($byCategory);

        $obsolete = Product::whereNotIn('id', array_column($rows, 'id'))->count();
        $this->line(count($rows).' active POS products ready ('.$outOfStock.' out of stock, '.$bestsellers
            .' bestsellers, '.$newArrivals.' new arrivals, '.$withoutImage.' without an image).');
        if ($obsolete > 0) $this->line($obsolete.' existing catalogue rows would be removed.');
        $this->table(['Category', 'Products'], collect($byCategory)->map(fn ($count, $id) => [$id, $count])->values()->all());
    }

    /**
     * Order history keeps a foreign key to its products, so a removal that
     * would break history is refused instead of silently cascading.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function confirmRemovals(array $rows): bool
    {
        $referenced = DB::table('order_items')
            ->whereNotIn('product_id', array_column($rows, 'id'))
            ->distinct()
            ->pluck('product_id');

        if ($referenced->isNotEmpty()) {
            $this->error('Refusing to remove products still referenced by order history: '.$referenced->take(10)->implode(', ')
                .($referenced->count() > 10 ? ' …' : ''));
            $this->error('Import cancelled; nothing was changed.');

            return false;
        }

        return true;
    }

    private function printImageWarnings(): void
    {
        foreach (array_slice($this->imageWarnings, 0, 10) as $warning) $this->warn($warning);
        if (count($this->imageWarnings) > 10) $this->warn('...and '.(count($this->imageWarnings) - 10).' more image warnings.');
    }
}
