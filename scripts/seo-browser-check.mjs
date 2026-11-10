import {createRequire} from 'node:module';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fixture=JSON.parse(readFileSync('backend/database/catalog/family-choice-products.json','utf8')).map(p=>({...p,inStock:true,stock:null,stockStatus:'available'})); fixture[0].stock=2;
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
page.setDefaultTimeout(60000);
const visit = url => page.goto(url, {waitUntil:'domcontentloaded',timeout:60000});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
mkdirSync('artifacts/seo',{recursive:true});
await page.route('http://seo.test/**', async route=>{
 const url=new URL(route.request().url());
 if(url.pathname==='/api/products') return route.fulfill({json:fixture});
 if(url.pathname==='/api/settings') return route.fulfill({json:{currency:'TZS',tax_rate:.18,delivery_cents:500000,free_delivery_cents:0,mobile_money_enabled:false,selcom_enabled:false}});
 if(url.pathname.startsWith('/api/')) return route.fulfill({status:401,json:{message:'Unauthenticated.'}});
 const path=route.request().isNavigationRequest()?resolve('dist/index.html'):resolve('dist','.'+decodeURIComponent(url.pathname));
 if(!path.startsWith(resolve('dist'))||!existsSync(path)) return route.fulfill({status:404,body:'Not found'});
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
 return route.fulfill({body:readFileSync(path),contentType:types[extname(path)]||'application/octet-stream'});
});
try {
 for(const width of [360,390,768,1024,1440,1920]) {
  await page.setViewportSize({width,height:900}); await visit('http://seo.test/shop');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  assert.equal(await page.locator('.shop-product-grid .product-card').count(),24);
  assert.equal(await page.locator('.shop-product-grid a[href^="/products/"]').count(),48);
  await page.locator('.shop-banner img').evaluate(i=>i.decode());
  if(width<1024) { const filters=page.getByRole('button',{name:'Filters',exact:true});await filters.click(); await page.getByRole('dialog',{name:'Product filters'}).waitFor(); await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});assert.ok(await filters.evaluate(e=>e===document.activeElement)); }
  if(width===390||width===1440) await page.screenshot({path:`artifacts/seo/shop-${width}.png`});
  console.log(`PASS responsive catalogue ${width}px`);
 }
 await page.getByRole('button',{name:'Product page 2',exact:true}).click();
 await page.getByText('Showing 25–48 of 247 products',{exact:true}).waitFor();assert.match(page.url(),/page=2/);
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.getByText('Showing 25–48 of 247 products',{exact:true}).waitFor();
 assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://familychoiceminimarket.co.tz/shop?page=2');
 await page.goBack({waitUntil:'domcontentloaded',timeout:60000});await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
 const card=page.locator('.shop-product-grid .product-card').first(); await card.getByRole('button',{name:'Add to cart',exact:true}).click(); await card.getByRole('button',{name:/Increase.*quantity/}).click();assert.ok(await card.getByRole('button',{name:/Increase.*quantity/}).isDisabled());
 const heart=card.getByRole('button',{name:/Save.*wishlist/});await heart.click();assert.equal(await card.getByRole('button',{name:/Remove.*wishlist/}).getAttribute('aria-pressed'),'true');
 await card.getByRole('link').first().click();await page.locator('h1').waitFor();assert.match(page.url(),/\/products\//);
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.locator('h1').waitFor();assert.match(page.url(),/\/products\//);assert.match(await page.title(),/FAMILY CHOICE SUPERMARKET/);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'index, follow');
 const schema=JSON.parse(await page.locator('#storefront-schema').textContent());assert.ok(schema['@graph'].some(e=>e['@type']==='Product'));
 await visit('http://seo.test/shop?category=pantry'); await page.getByRole('heading',{name:'Pantry Staples',exact:true}).waitFor();assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://familychoiceminimarket.co.tz/shop?category=pantry');
 await visit('http://seo.test/shop?search=zzzz-no-match');await page.getByText('No products found',{exact:true}).waitFor();assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, follow');
 await visit('http://seo.test/account');await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, follow');assert.deepEqual(JSON.parse(await page.locator('#storefront-schema').textContent()),{});
 await visit('http://seo.test/missing');await page.getByRole('heading',{name:'Page not found'}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS links, metadata, pagination/reload/back, cart stock limit, wishlist, category/search/private indexing, 404 and overlay focus; no JavaScript errors.');
}finally {await browser.close();}
