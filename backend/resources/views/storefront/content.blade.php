<div class="store-container py-8">
    <header><a href="/" aria-label="FAMILY CHOICE SUPERMARKET home"><img src="/images/brand/family-choice-logo.svg" width="250" height="53" alt="FAMILY CHOICE SUPERMARKET"></a>
        <nav aria-label="Main navigation"><a href="/shop">Shop</a> · <a href="/deals">Deals</a> · <a href="/delivery">Delivery</a> · <a href="/help">Contact</a> · <a href="/about">About us</a></nav>
    </header>
    <main><h1>{{ $heading }}</h1><p>{{ $description }}</p>
    @if($status !== 200)
        <p><a href="/shop">Browse the shop</a> or <a href="/help">contact the store</a>.</p>
    @elseif($private)
        <p>Enable JavaScript to manage your account, basket or order securely.</p>
    @elseif($product)
        @if(!empty($product['image']))<img src="{{ $product['image'] }}" width="280" height="280" style="object-fit:contain" alt="{{ $product['imageAlt'] ?? $product['name'] }}">@endif
        <p>{{ $product['unit'] ?? '' }}</p><p>{{ $product['description'] ?? '' }}</p>
        <p><strong>TSh {{ number_format($product['price'], 0) }}</strong></p>
        <p>{{ ($product['stockStatus'] ?? '') === 'unverified' ? 'Availability requires confirmation' : ($product['inStock'] ? 'In stock' : 'Out of stock') }}</p>
        <p><a href="/shop?category={{ rawurlencode($product['categoryId'] ?? '') }}">Browse this category</a></p>
        <noscript><p>Enable JavaScript to add products to your basket and check out.</p></noscript>
    @else
        @if(in_array($path, ['/', '/shop']))
        <nav aria-label="Product categories">@foreach(config('seo.categories') as $id => $name)<a href="/shop?category={{ rawurlencode($id) }}">{{ $name }}</a> · @endforeach</nav>
        @endif
        @if($path === '/shop')<p>{{ $total }} products. Page {{ $page }} of {{ $pageCount }}.</p>@endif
        @if($products->isNotEmpty())
        <ul>@foreach($products as $item)<li><a href="/products/{{ rawurlencode($item['id']) }}">{{ $item['name'] }}</a> - {{ $item['unit'] ?? '' }} - TSh {{ number_format($item['price'], 0) }}</li>@endforeach</ul>
        @elseif(in_array($path, ['/shop', '/deals', '/new-arrivals']))<p>No products available in this selection.</p>@endif
        @if($path === '/shop' && $pageCount > 1)
        <nav aria-label="Product pagination">@for($number = 1; $number <= $pageCount; $number++)<a href="/shop?{{ http_build_query(array_filter(['category' => $category, 'search' => $search, 'page' => $number > 1 ? $number : null], fn ($value) => $value !== null && $value !== '')) }}" @if($page === $number) aria-current="page" @endif>Page {{ $number }}</a> @endfor</nav>
        @endif
        @if(in_array($path, ['/', '/about', '/help', '/delivery']))
            <h2>Visit or contact the store</h2><address>{{ config('seo.address') }}</address><p>Opening hours: 8:00 AM–9:00 PM.</p>
            <p><a href="tel:{{ config('seo.phone') }}">+255 768 641 810</a> · <a href="mailto:{{ config('seo.email') }}">{{ config('seo.email') }}</a></p>
            <p>Delivery is within Morogoro only. Timing is arranged with the store. Pickup is available.</p>
            @if($path === '/delivery')<p>Delivery fee: TSh {{ number_format(config('store.delivery_cents') / 100, 0) }}. Pickup has no delivery fee. Review groceries, delivery, tax and total before placing your order.</p>@endif
        @endif
        @if($path === '/how-to-order')<ol><li>Choose groceries and quantities.</li><li>Sign in and choose delivery or pickup.</li><li>Review items, fees and payment method before ordering.</li><li>Follow your order and payment status separately in your account.</li></ol>@endif
        @if($path === '/privacy')<p>Contact the store with questions about your customer information or sign in to request deletion. Enable JavaScript to read the complete privacy notice.</p>@endif
        <noscript><p>Enable JavaScript for shopping controls and the full interactive website.</p></noscript>
    @endif
    </main>
    <footer><a href="/privacy">Privacy notice</a> · <a href="/how-to-order">How to order</a> · <a href="/help">Help & contact</a></footer>
</div>
