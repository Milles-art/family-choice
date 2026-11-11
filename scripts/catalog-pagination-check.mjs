import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const cards=page.locator('.shop-product-grid .product-card');
try {
  const products=await (await page.request.get('http://127.0.0.1:8000/api/products')).json();
  assert.equal(products.length,247);
  assert.ok(products.every(p=>p.inStock && p.orderable && p.stockStatus==='available' && p.stock===null));
  await page.goto('http://127.0.0.1:8000/shop');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  assert.equal(await cards.count(),24);
  assert.equal(await page.getByText(/Availability unverified|Estimate-based|Retailer-listed basis|Store approved/).count(),0);
  const ids=[];
  for(let n=1;n<=11;n++){
    ids.push(...await cards.evaluateAll(els=>els.map(el=>el.dataset.productId)));
    if(n<11){await page.getByRole('button',{name:'Next product page',exact:true}).click();await page.getByRole('button',{name:`Product page ${n+1}`,exact:true}).waitFor();}
  }
  assert.equal(ids.length,247);assert.equal(new Set(ids).size,247);assert.equal(await cards.count(),7);
  assert.ok(await page.getByRole('button',{name:'Next product page',exact:true}).isDisabled());
  await page.getByRole('combobox',{name:'Sort products'}).selectOption('price-low');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  const firstId=await cards.first().getAttribute('data-product-id');
  assert.equal(products.find(p=>p.id===firstId).price,Math.min(...products.map(p=>p.price)));
  await cards.first().getByRole('button',{name:'Add to cart',exact:true}).click();
  await cards.first().getByRole('button',{name:/^Save .* to wishlist$/}).click();
  await page.getByRole('button',{name:'Next product page',exact:true}).click();
  await page.getByRole('button',{name:'Previous product page',exact:true}).click();
  assert.equal(await cards.first().getByRole('button',{name:/^Remove .* from wishlist$/}).getAttribute('aria-pressed'),'true');
  assert.ok(await cards.first().getByRole('group',{name:/quantity$/}).isVisible());
  await page.locator('.shop-sidebar').getByRole('button',{name:'Fruits & Vegetables',exact:true}).click();
  await page.getByText('Showing 1–24 of 31 products',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Next product page',exact:true}).click();
  assert.equal(await cards.count(),7);
  await page.getByRole('button',{name:'Search',exact:true}).click();
  const search=page.getByRole('combobox',{name:'Search products'});await search.fill('FC-058');await search.press('Enter');
  await page.locator('[data-product-id="FC-056"]').waitFor();assert.equal(await cards.count(),1);
  assert.equal(await page.getByRole('navigation',{name:'Product pagination'}).count(),0);
  await page.goto('http://127.0.0.1:8000/shop');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  await page.locator('.shop-banner img').evaluate(el=>el.decode());
  for(const width of [360,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1100});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);
    if(width===390||width===1440)await page.screenshot({path:`artifacts/product-import/shop-${width}.png`});
  }
  await page.getByRole('button',{name:'Open cart, 1 items',exact:true}).click();
  await page.getByRole('button',{name:'Proceed to Checkout',exact:true}).click();
  await page.getByRole('heading',{name:'Checkout',exact:true}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isEnabled());
  assert.equal(await page.getByText(/Availability must be confirmed/).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: 24 per page, all 247 unique across 11 pages, seven on final page; filter/search/sort resets; cart/wishlist persistence; verified availability and checkout; six widths; no JavaScript errors.');
  fs.writeFileSync('artifacts/product-import/pagination-result.json',JSON.stringify({products:247,pages:11,pageSize:24,widths:[360,390,768,1024,1440,1920],errors},null,2));
} finally {await browser.close();}
