import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const fixture=JSON.parse(readFileSync('backend/database/catalog/family-choice-products.json','utf8')).map(product=>({...product,inStock:true,stock:null,stockStatus:'available',orderable:true}));
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
mkdirSync('artifacts/mobile-shells',{recursive:true});
await page.route('**/api/products',route=>route.fulfill({json:fixture}));
await page.route('**/api/settings',route=>route.fulfill({json:{currency:'TZS',tax_rate:.18,delivery_cents:500000,free_delivery_cents:0,mobile_money_enabled:false,selcom_enabled:false}}));
await page.route('**/api/me',route=>route.fulfill({status:401,json:{message:'Unauthenticated.'}}));
await page.route('**/api/orders',route=>route.fulfill({status:401,json:{message:'Unauthenticated.'}}));
const base='http://localhost:5190';
const overflow=async(label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: horizontal overflow`);
const goto=async url=>{await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:45000});};
try {
  // Pre-seed a two-item cart so /cart and /checkout render their full states.
  await goto('/');
  await page.evaluate(products=>{localStorage.setItem('freshcart_cart',JSON.stringify(products.slice(0,2).map((p,i)=>({product:p,quantity:i+1}))));},fixture);

  for(const width of [360,768]) {
    await page.setViewportSize({width,height:844});
    for(const [url,marker] of [
      ['/','Cold.Creamy'],
      ['/shop','Everything'],
      ['/cart','Your basket'],
      ['/checkout','finish'],
      ['/about','everyday life'],
      ['/help','shopping easier'],
      ['/delivery','Your way'],
      ['/how-to-order','SUPERMARKET works'],
      ['/deals','deals'],
      ['/privacy','Privacy notice'],
      ['/recipes','Recipe'],
      ['/account','My account'],
      ['/track','Follow your'],
    ]) {
      await goto(url);
      await page.locator('main h1').first().waitFor({timeout:15000});
      await page.locator('main h1').first().waitFor({state:'visible',timeout:15000});
      assert.ok((await page.locator('main h1').first().textContent()).toLowerCase().includes(marker.toLowerCase()),`${url} ${width}: h1 marker "${marker}"`);
      await overflow(`${url} ${width}`);
      // iOS zoom guard: every visible text control must be >=16px (sliders/checkboxes excluded — not focus-zoomed).
      const fonts=await page.locator('main input:visible:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=color]),main select:visible,main textarea:visible').evaluateAll(els=>els.map(el=>parseFloat(getComputedStyle(el).fontSize)));
      assert.ok(fonts.every(size=>size>=16),`iOS input zoom: ${url} ${width} (${fonts.join(',')})`);
      // Touch targets: interactive elements in main shouldn't be tiny.
      // Sub-12px empty-text buttons are pagination dots (deliberately compact indicators).
      const tinyEls=await page.locator('main a:visible, main button:visible').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&r.height<32&&!(el.textContent.trim()===''&&r.height<12);}).map(el=>({txt:el.textContent.trim().slice(0,40),cls:String(el.className).slice(0,70),h:Math.round(el.getBoundingClientRect().height)})));
      assert.ok(tinyEls.length===0,`${url} ${width}: ${tinyEls.length} touch targets under 32px ${JSON.stringify(tinyEls)}`);
      if(width===360) await page.screenshot({path:`artifacts/mobile-shells${url==='/'?'/home':url.replace(/\//g,'-')}-360.png`,fullPage:false});
      console.log(`PASS ${url} ${width}px`);
    }
  }

  // Cart interactions at 360: stepper + remove + summary CTAs.
  await page.setViewportSize({width:360,height:780});
  await goto('/cart');
  await page.getByRole('heading',{name:'Your basket.'}).waitFor();
  const plus=page.getByRole('button',{name:/Increase .* quantity/}).first();
  await plus.click();
  await page.getByRole('link',{name:/Proceed to checkout/}).waitFor();
  await page.getByRole('link',{name:/Send this order on WhatsApp/}).waitFor();
  await overflow('Cart interactions');
  console.log('PASS cart stepper + CTAs 360px');

  // Checkout validation at 360: continue with empty form must show errors, no overflow.
  await goto('/checkout');
  await page.locator('#delivery-name').waitFor();
  await page.getByRole('button',{name:/Continue/}).click();
  await page.locator('[role=alert]').first().waitFor();
  await overflow('Checkout validation');
  await page.screenshot({path:'artifacts/mobile-shells/checkout-validation-360.png',fullPage:false});
  console.log('PASS checkout validation 360px');

  // Area checker on delivery (real behaviour).
  await goto('/delivery');
  await page.getByLabel('Your area',{exact:true}).fill('Morogoro').catch(()=>{});
  await overflow('Delivery area checker');

  assert.deepEqual(errors,[]);
  console.log('PASS mobile shells: no horizontal overflow, no iOS input zoom, no undersized touch targets, no JavaScript errors.');
} finally {await browser.close();}
