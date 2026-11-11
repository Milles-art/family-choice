<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class StorefrontController extends Controller
{
    private const PRIVATE_PATHS = ['/account', '/cart', '/checkout', '/wishlist', '/track', '/forgot-password', '/reset-password'];

    public function sitemap()
    {
        try {
            $urls = array_map(fn ($path) => $this->url($path), array_keys(config('seo.pages')));
            $products = Product::orderBy('id')->get();
            if (! $products->contains(fn ($p) => ($p->details['originalPrice'] ?? 0) > $p->price_cents / 100)) $urls = array_values(array_diff($urls, [$this->url('/deals')]));
            if (! $products->contains(fn ($p) => in_array('new', $p->details['tags'] ?? [], true))) $urls = array_values(array_diff($urls, [$this->url('/new-arrivals')]));
            $categories = $products->map(fn ($p) => $p->details['categoryId'] ?? null)->unique();
            foreach (config('seo.categories') as $id => $label) {
                if ($categories->contains($id)) $urls[] = $this->url('/shop?category='.rawurlencode($id));
            }
            foreach ($products as $product) $urls[] = $this->productUrl($product->id);
            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            foreach (array_unique($urls) as $url) $xml .= '<url><loc>'.htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</loc></url>';
            return response($xml.'</urlset>', 200, ['Content-Type' => 'application/xml; charset=UTF-8', 'Cache-Control' => 'public, max-age=300']);
        } catch (Throwable $error) {
            report($error);
            return response('Sitemap temporarily unavailable.', 503)->header('Retry-After', '60');
        }
    }

    public function page(Request $request)
    {
        $path = '/'.trim($request->path(), '/');
        $legacyProduct = $path === '/product';
        $productId = is_string($request->query('id')) ? $request->query('id') : '';
        if (preg_match('~^/products/([^/]+)$~D', $path, $matches)) {
            $productId = $matches[1];
            $path = '/product';
        }
        if ($legacyProduct && $productId === '') return redirect('/shop', 301);
        $private = in_array($path, self::PRIVATE_PATHS, true);
        $status = 200;
        $indexable = ! $private;
        $products = collect();
        $product = null;
        $category = is_string($request->query('category')) ? $request->query('category') : '';
        $search = is_string($request->query('search')) ? Str::limit(trim($request->query('search')), 200, '') : '';
        $pageValue = $request->query('page', '1');
        $page = is_scalar($pageValue) && ctype_digit((string) $pageValue) ? max(1, min(1000000, (int) $pageValue)) : 1;
        $canonical = $this->url($path);
        [$label, $description] = config('seo.pages')[$path] ?? ['Page not found', 'This page could not be found. Browse the shop or contact FAMILY CHOICE SUPERMARKET.'];
        $heading = $label;
        $pageCount = 1;
        $total = 0;

        try {
            if ($path === '/product') {
                $id = $productId;
                $record = strlen($id) <= 100 ? Product::find($id) : null;
                if ($record) {
                    if ($legacyProduct || $productId !== $record->id) return redirect('/products/'.rawurlencode($record->id), 301);
                    $product = $record->storefront();
                    $label = $heading = $product['name'];
                    $description = Str::limit(trim(($product['name'].' - '.($product['unit'] ?? '').'. '.($product['description'] ?? ''))), 155, '...');
                    $canonical = $this->productUrl($record->id);
                } else $status = 404;
            } elseif (in_array($path, ['/', '/shop', '/deals', '/new-arrivals'], true)) {
                $products = Product::latest()->get()->map(fn ($p) => $p->storefront());
                if ($path === '/shop') {
                    if ($category !== '') {
                        if (! array_key_exists($category, config('seo.categories'))) $status = 404;
                        else {
                            $label = $heading = config('seo.categories')[$category];
                            $description = 'Browse '.$heading.' at FAMILY CHOICE SUPERMARKET in Morogoro. See current prices, pack sizes and stock information.';
                            $products = $products->where('categoryId', $category);
                            $canonical = $this->url('/shop?category='.rawurlencode($category));
                        }
                    }
                    if ($search !== '') {
                        $indexable = false;
                        $heading = 'Search: '.$search;
                        $products = $products->filter(fn ($p) => str_contains(Str::lower(($p['name'] ?? '').' '.($p['description'] ?? '')), Str::lower($search)));
                    }
                }
                if ($path === '/deals') $products = $products->filter(fn ($p) => ($p['originalPrice'] ?? 0) > $p['price']);
                if ($path === '/new-arrivals') $products = $products->filter(fn ($p) => in_array('new', $p['tags'] ?? [], true));
                $total = $products->count();
                $pageCount = max(1, (int) ceil($total / 24));
                if ($path === '/shop' && $page > $pageCount) $status = 404;
                if ($path === '/shop' && $page > 1 && $search === '') {
                    $canonical .= ($category !== '' ? '&' : '?').'page='.$page;
                    $label .= ' - Page '.$page;
                }
                if ($total === 0 && $path !== '/') $indexable = false;
                $products = $products->values()->slice($path === '/shop' ? ($page - 1) * 24 : 0, $path === '/' ? 6 : 24);
            } elseif (! array_key_exists($path, config('seo.pages')) && ! $private) $status = 404;
        } catch (Throwable $error) {
            report($error);
            $status = 503;
            $label = $heading = 'The shop is temporarily unavailable';
            $description = 'Please try again shortly or contact the store for help.';
        }
        if ($private) {
            $label = $heading = match ($path) {
                '/account' => 'My account', '/cart', '/checkout' => 'Checkout', '/wishlist' => 'Your wishlist',
                '/track' => 'Track your order', '/forgot-password' => 'Forgot password', default => 'Reset password',
            };
            $description = 'Manage your FAMILY CHOICE SUPERMARKET account and orders securely.';
        }
        if ($status === 404) {
            $label = $heading = 'Page not found';
            $description = 'This page could not be found. Browse the shop or contact FAMILY CHOICE SUPERMARKET.';
        }
        $indexable = $indexable && $status === 200;
        $title = $label.' | '.config('seo.name');
        $image = $product && ! empty($product['image']) ? $this->url($product['image']) : $this->url('/images/brand/social-sharing.png');
        $schema = $this->structuredData($path, $heading, $canonical, $product, $indexable);
        $fallback = view('storefront.content', compact('path', 'heading', 'description', 'products', 'product', 'status', 'private', 'category', 'search', 'page', 'pageCount', 'total'))->render();
        $head = view('storefront.head', compact('title', 'description', 'canonical', 'image', 'schema', 'indexable'))->render();
        $html = file_get_contents(public_path('index.html'));
        $html = preg_replace('~<title>.*?</title>|<meta\s+(?:name|property)=["\'](?:description|robots|twitter:[^"\']+|og:[^"\']+)["\'][^>]*>|<link\s+rel=["\']canonical["\'][^>]*>~is', '', $html);
        $html = str_replace('</head>', $head."\n</head>", $html);
        $html = str_replace('<div id="root"></div>', '<div id="root">'.$fallback.'</div>', $html);
        $response = response($html, $status)->header('X-Robots-Tag', $indexable ? 'index, follow' : 'noindex, follow');
        $response->headers->set('Cache-Control', 'no-store, private');
        if ($status === 503) $response->headers->set('Retry-After', '60');
        return $response;
    }

    private function url(string $path): string
    {
        if (str_starts_with($path, 'https://') || str_starts_with($path, 'http://')) return $path;
        return rtrim(config('seo.origin'), '/').'/'.ltrim($path, '/');
    }

    private function productUrl(string $id): string
    {
        return $this->url('/products/'.rawurlencode($id));
    }

    private function structuredData(string $path, string $heading, string $canonical, ?array $product, bool $indexable): array
    {
        if (! $indexable) return [];
        $business = ['@type' => 'GroceryStore', '@id' => $this->url('/#store'), 'name' => config('seo.name'), 'url' => $this->url('/'),
            'image' => $this->url('/images/brand/social-sharing.png'), 'logo' => $this->url('/images/brand/family-choice-logo.svg'),
            'telephone' => config('seo.phone'), 'email' => config('seo.email'),
            'address' => ['@type' => 'PostalAddress', 'streetAddress' => 'Mafiga Shell', 'addressLocality' => 'Morogoro', 'addressCountry' => 'TZ'],
            'areaServed' => ['@type' => 'City', 'name' => 'Morogoro']];
        $graph = [$business, ['@type' => 'WebPage', '@id' => $canonical, 'url' => $canonical, 'name' => $heading, 'isPartOf' => ['@id' => $this->url('/#website')]],
            ['@type' => 'WebSite', '@id' => $this->url('/#website'), 'url' => $this->url('/'), 'name' => config('seo.name')]];
        if ($path !== '/') $graph[] = ['@type' => 'BreadcrumbList', 'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $this->url('/')],
            ['@type' => 'ListItem', 'position' => 2, 'name' => $heading, 'item' => $canonical],
        ]];
        if ($product) {
            $entry = ['@type' => 'Product', 'name' => $product['name'], 'sku' => $product['id'], 'url' => $canonical, 'description' => $product['description'] ?? $product['name']];
            if (! empty($product['image'])) $entry['image'] = [$this->url($product['image'])];
            // Do not publish estimates or unverified availability as a merchant offer.
            if (($product['priceType'] ?? '') === 'store-confirmed' && ($product['stockStatus'] ?? '') !== 'unverified' && is_numeric($product['price']) && $product['price'] > 0) {
                $entry['offers'] = ['@type' => 'Offer', 'url' => $canonical, 'priceCurrency' => config('store.currency'), 'price' => number_format($product['price'], 2, '.', ''),
                    'availability' => 'https://schema.org/'.($product['inStock'] ? 'InStock' : 'OutOfStock'), 'seller' => ['@id' => $this->url('/#store')]];
            }
            $graph[] = $entry;
        }
        return ['@context' => 'https://schema.org', '@graph' => $graph];
    }
}
