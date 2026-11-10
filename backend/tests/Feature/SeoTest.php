<?php
namespace Tests\Feature;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class SeoTest extends TestCase
{
    use RefreshDatabase, \Tests\CreatesTestProducts;
    protected function setUp(): void { parent::setUp(); $this->createTestProducts(); }
    public function test_public_content_is_readable_without_javascript(): void {
        $this->get('/shop')->assertOk()->assertSee('Automated test item p1')->assertSee('TSh 5,200')->assertSee('href="/products/p1"', false)->assertSee('<link rel="canonical" href="https://familychoiceminimarket.co.tz/shop">',false);
        $this->get('/help')->assertOk()->assertSee('Mafiga Shell')->assertSee('info@familychoiceminimarket.co.tz');
        $this->get('/shop?category=pantry')->assertOk()->assertSee('Pantry Staples')->assertSee('/shop?category=pantry',false);
    }
    public function test_sitemap_is_xml_and_excludes_private_and_empty_selections(): void {
        $r=$this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type','application/xml; charset=UTF-8');
        $xml=simplexml_load_string($r->getContent()); $this->assertNotFalse($xml);
        $r->assertSee('/products/p1',false)->assertSee('/shop?category=pantry',false)->assertDontSee('/account')->assertDontSee('/checkout')->assertDontSee('/deals')->assertDontSee('/new-arrivals');
    }
    public function test_missing_pages_return_404_and_private_pages_are_noindex(): void {
        foreach(['/does-not-exist','/product?id=missing','/shop?category=unknown','/shop?page=999'] as $url) $this->get($url)->assertNotFound()->assertHeader('X-Robots-Tag','noindex, follow');
        foreach(['/account','/checkout','/track?order=123'] as $url) $this->get($url)->assertOk()->assertHeader('X-Robots-Tag','noindex, follow')->assertDontSee('Automated test item');
        $this->get('/shop?search=missing')->assertOk()->assertHeader('X-Robots-Tag','noindex, follow');
    }
    public function test_product_offers_use_confirmed_prices_and_escape_content(): void {
        $p=Product::findOrFail('p1'); $p->details=[...$p->details,'name'=>'Rice </script><script>alert(1)</script>','priceType'=>'store-confirmed','stockStatus'=>'available'];$p->save();
        $r=$this->get('/products/p1')->assertOk()->assertSee('"priceCurrency":"TZS"',false)->assertSee('"price":"5200.00"',false)->assertDontSee('<script>alert(1)</script>',false);
        preg_match('~<script id="storefront-schema"[^>]*>(.*?)</script>~s',$r->getContent(),$matches); $schema=json_decode($matches[1],true,512,JSON_THROW_ON_ERROR); $this->assertSame('Product',end($schema['@graph'])['@type']);
        $p->details=[...$p->details,'priceType'=>'planning-estimate'];$p->save();$this->get('/products/p1')->assertDontSee('"@type":"Offer"',false);
    }
    public function test_legacy_product_urls_redirect_and_new_urls_are_canonical(): void {
        $this->get('/product?id=p1')->assertStatus(301)->assertRedirect('/products/p1');
        $this->get('/product?id=p1&utm_source=shared')->assertStatus(301)->assertRedirect('/products/p1');
        $this->get('/product')->assertStatus(301)->assertRedirect('/shop');
        $this->get('/products/p1')->assertOk()->assertSee('href="https://familychoiceminimarket.co.tz/products/p1"',false);
        $this->get('/products/missing')->assertNotFound();
        $this->get('/products/p1/extra')->assertNotFound();
        $this->get('/sitemap.xml')->assertDontSee('/product?id=',false);
    }
    public function test_catalogue_pagination_has_distinct_canonicals(): void {
        for($i=3;$i<=28;$i++) Product::create(['id'=>'p'.$i,'details'=>['name'=>'Test product '.$i,'categoryId'=>'pantry','tags'=>[]],'price_cents'=>100000,'stock'=>10]);
        $this->get('/shop?page=2')->assertOk()->assertSee('href="https://familychoiceminimarket.co.tz/shop?page=2"',false)->assertSee('Page 2 of 2');
    }
}
