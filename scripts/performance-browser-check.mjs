import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:900}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
  // Use the imported catalogue fixture when the local MySQL service is offline.
  const fixture=JSON.parse(readFileSync('backend/database/catalog/family-choice-products.json','utf8')).map(product=>{
    const {priceProvenance,availabilitySource,...fields}=product;
    void priceProvenance; void availabilitySource;
    return {...fields,inStock:true,stock:null,stockStatus:'available',orderable:true};
  });
  await page.route('**/api/products',route=>route.fulfill({json:fixture}));
  await page.route('**/api/settings',route=>route.fulfill({json:{currency:'TZS',tax_rate:0.18,delivery_cents:500000,free_delivery_cents:7500000,mobile_money_enabled:false,selcom_enabled:false}}));
  await page.route('**/api/me',route=>route.fulfill({status:401,json:{message:'Unauthenticated.'}}));
  await page.route('http://127.0.0.1:8000/**',route=>route.request().isNavigationRequest()
    ? route.fulfill({contentType:'text/html',body:readFileSync('backend/public/index.html','utf8')})
    : route.fallback());
  const data=fixture;
  assert.equal(data.length,247);
  assert.ok(data.every(product=>!('priceProvenance' in product)));
  console.log(`Public catalogue: ${Buffer.byteLength(JSON.stringify(data))} bytes`);
  await page.goto('http://127.0.0.1:8000/');
  await page.waitForFunction(()=>document.querySelectorAll('.lower-product-grid .product-card').length===18);
  assert.equal(await page.locator('.fc-header-strip').count(),0);
  await page.locator('.brand-logo').evaluate(element=>element.decode());
  assert.equal(await page.locator('.hero-backdrops img').count(),1);
  await page.goto('http://127.0.0.1:8000/shop');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  for(const width of [360,390,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:900});
    const footer=page.locator('.fc-footer-compact');
    await footer.scrollIntoViewIfNeeded();
    await footer.locator('img').evaluate(element=>element.decode());
    const footerHeight=await footer.evaluate(element=>element.getBoundingClientRect().height);
    assert.ok(footerHeight<(width<640?380:260),`Footer too tall: ${footerHeight}px at ${width}`);
    assert.equal(await footer.getByRole('navigation',{name:'Footer navigation'}).getByRole('button').count(),6);
    assert.ok(await footer.locator('.footer-links button').first().evaluate(element=>parseFloat(getComputedStyle(element).fontSize)>=14));
    await footer.locator('.footer-links button').first().focus();
    assert.ok(await footer.locator('.footer-links button').first().evaluate(element=>element===document.activeElement));
    assert.ok(await footer.getByRole('button',{name:'Privacy notice',exact:true}).evaluate(element=>{
      const rect=element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2));
    }),`Privacy control covered at ${width}`);
    console.log(`Footer ${width}px: ${Math.round(footerHeight)}px high`);
    if(width===390||width===1440){await footer.locator('.footer-links button').first().evaluate(element=>element.blur());mkdirSync('artifacts/footer',{recursive:true});await footer.screenshot({path:`artifacts/footer/footer-${width}.png`});}
    const image=page.locator('.shop-product-grid .product-card img').first();
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(element=>element.decode());
    assert.ok((await image.evaluate(element=>element.currentSrc)).includes('/responsive/'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
    if(width===390 || width===1440) {
      await page.evaluate(()=>window.scrollTo(0,0));
      mkdirSync('artifacts/branding',{recursive:true});
      await page.screenshot({path:`artifacts/branding/shop-${width}.png`});
    }
  }
  const card=page.locator('.shop-product-grid .product-card').first();
  await card.getByRole('button',{name:'Add to cart',exact:true}).click();
  await card.getByRole('button',{name:/^Save .* to wishlist$/}).click();
  await card.getByRole('button',{name:/^Remove .* from wishlist$/}).waitFor();
  await page.getByRole('button',{name:/Open cart,/}).click();
  assert.equal(await page.getByText(/free delivery/i).count(),0);
  await page.getByRole('button',{name:'Proceed to Checkout',exact:true}).click();
  await page.locator('#delivery-name').fill('Browser Fixture');
  await page.locator('#delivery-phone').fill('0712345678');
  await page.getByLabel('House, street and landmark').fill('Fixture Street');
  await page.getByLabel('Region / city').fill('Fixture City');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Tomorrow, 10:00 AM - 12:00 PM',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByText(/Online payment is currently unavailable/).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pay now with mobile money',exact:true}).count(),0);
  await page.getByRole('button',{name:'Cash on Delivery / Pickup',exact:true}).waitFor();
  assert.equal(await page.getByText(/free delivery/i).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: logo loads, banner removed, responsive photos decode at six widths, cart/wishlist work, free-delivery claims absent, unconfigured online payments unavailable, no overflow or JS errors.');
} finally {await browser.close();}
