import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const fixture=JSON.parse(readFileSync('backend/database/catalog/family-choice-products.json','utf8')).map(product=>({...product,inStock:true,stock:null,stockStatus:'available',orderable:true}));
fixture[0].stock=2; // Exercise a real stock limit without modifying the catalogue.
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
mkdirSync('artifacts/mobile',{recursive:true});
await page.route('**/api/products',route=>route.fulfill({json:fixture}));
await page.route('**/api/settings',route=>route.fulfill({json:{currency:'TZS',tax_rate:.18,delivery_cents:500000,free_delivery_cents:0,mobile_money_enabled:false,selcom_enabled:false}}));
await page.route('**/api/me',route=>route.fulfill({status:401,json:{message:'Unauthenticated.'}}));
await page.route('http://127.0.0.1:8000/**',route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:readFileSync('backend/public/index.html','utf8')}):route.fallback());
const overflow=async(label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: horizontal overflow`);
try {
  for(const width of [360,390,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:844});
    await page.goto('http://127.0.0.1:8000/');
    await page.locator('.hero-backdrops img.is-active').evaluate(img=>img.decode());
    await overflow(`Home ${width}`);
    if(width<768) {
      const layout=await page.locator('.hero-slideshow').evaluate(element=>{
        const image=element.querySelector('img'),copy=element.querySelector('.hero-copy');
        return {background:getComputedStyle(element).backgroundColor,fit:getComputedStyle(image).objectFit,imageHeight:image.getBoundingClientRect().height,imageBottom:image.getBoundingClientRect().bottom,copyTop:copy.getBoundingClientRect().top,height:element.getBoundingClientRect().height};
      });
      assert.equal(layout.background,'rgb(255, 255, 255)');
      assert.equal(layout.fit,'contain');
      assert.ok(layout.imageBottom<=layout.copyTop);
      assert.ok(layout.height<560,`Hero ${width} too tall: ${layout.height}`);
      const targets=await page.locator('.header-row > button:first-child, .header-icon:visible').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));
      assert.ok(targets.every(w=>w>=44));
      await page.screenshot({path:`artifacts/mobile/home-${width}.png`});
    }
    await page.goto('http://127.0.0.1:8000/shop');
    await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
    await page.locator('.shop-banner img').evaluate(img=>img.decode());
    await overflow(`Shop ${width}`);
    if(width<1024) {
      const filters=page.getByRole('button',{name:'Filters',exact:true});
      await filters.click();
      await page.getByRole('dialog',{name:'Product filters'}).waitFor();
      assert.ok(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement)));
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({state:'detached'});
      assert.ok(await filters.evaluate(el=>el===document.activeElement));
    } else assert.ok(await page.locator('.shop-sidebar').isVisible());
    if(width===390||width===1440) {await page.evaluate(()=>scrollTo(0,0)); await page.screenshot({path:`artifacts/mobile/shop-${width}.png`,fullPage:false});}
    const card=page.locator('.shop-product-grid .product-card').first();
    await card.locator('img').evaluate(img=>img.decode());
    assert.equal(await card.locator('img').evaluate(img=>getComputedStyle(img).objectFit),'contain');
    console.log(`PASS home/shop ${width}px`);
  }
  await page.setViewportSize({width:360,height:780});
  const card=page.locator('.shop-product-grid .product-card').first();
  await card.getByRole('button',{name:'Add to cart',exact:true}).click();
  await card.getByRole('button',{name:/Increase .* quantity/}).click();
  assert.ok(await card.getByRole('button',{name:/Increase .* quantity/}).isDisabled(),'Stock limit must disable increases');
  assert.ok(await card.evaluate(el=>el.scrollWidth<=el.clientWidth),'Cart stepper overflow');
  await page.getByRole('button',{name:/Open cart,/}).click();
  await page.getByRole('dialog',{name:'Your shopping cart'}).waitFor();
  assert.equal(await page.locator('.fc-whatsapp').count(),0);
  await overflow('Cart drawer');
  await page.screenshot({path:'artifacts/mobile/cart-360.png'});
  await page.keyboard.press('Escape');
  await card.getByRole('button',{name:/Save .* to wishlist/}).click();
  await card.getByRole('button',{name:/Remove .* from wishlist/}).waitFor();
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  const menu=page.getByRole('dialog',{name:'Navigation menu'});
  await menu.waitFor();
  await menu.getByRole('button',{name:'Wishlist',exact:true}).click();
  await page.getByRole('heading',{name:'Your wishlist'}).waitFor();
  await overflow('Wishlist');
  await page.goto('http://127.0.0.1:8000/shop');
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.getByRole('combobox',{name:'Search products'}).fill('unfindablexyz');
  await page.keyboard.press('Enter');
  await page.getByText('No products found',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear All Filters'}).click();
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  await page.getByRole('combobox',{name:'Sort products'}).selectOption('price-low');
  const prices=await page.locator('.shop-product-grid .product-price').allTextContents();
  const amounts=prices.map(value=>Number(value.replace(/\D/g,'')));
  assert.ok(amounts.every((n,i)=>i===0||n>=amounts[i-1]));
  await page.locator('.shop-product-grid .product-card').first().getByRole('button',{name:/^View /}).click();
  assert.ok(await page.locator('.product-detail-photo').evaluate(el=>el.getBoundingClientRect().height<=260));
  await overflow('Product detail');
  await page.goto('http://127.0.0.1:8000/checkout');
  await page.locator('#delivery-name').waitFor();
  assert.equal(await page.locator('.fc-whatsapp').count(),0);
  await overflow('Mobile checkout');
  await page.screenshot({path:'artifacts/mobile/checkout-360.png',fullPage:true});
  for(const url of ['/about','help','delivery','account','recipes','deals','new-arrivals','privacy']) {
    await page.goto(`http://127.0.0.1:8000/${url.replace(/^\//,'')}`);
    await page.locator('main h1').first().waitFor();
    await overflow(url);
    const fonts=await page.locator('main input:visible:not([type=checkbox]):not([type=radio]),main select:visible').evaluateAll(els=>els.map(el=>parseFloat(getComputedStyle(el).fontSize)));
    assert.ok(fonts.every(size=>size>=16),`iOS input zoom: ${url}`);
    if(url==='help') {
      assert.ok((await page.locator('.contact-methods').textContent()).includes('Mafiga Shell, Morogoro, Tanzania'));
      assert.ok((await page.locator('.contact-methods').textContent()).includes('8:00 AM–9:00 PM'));
      assert.equal(await page.locator('main a[href="mailto:info@familychoiceminimarket.co.tz"]').count(),1,'Confirmed contact mailbox must be linked');
      assert.match(await page.getByRole('link',{name:'Find Mafiga Shell on Google Maps'}).getAttribute('href'),/query=Mafiga/);
    }
    if(url==='delivery') {
      assert.ok((await page.locator('main').textContent()).includes('Delivery times are flexible'));
      await page.getByLabel('Your area',{exact:true}).fill('Morogoro');
      await page.getByText('Yes, we deliver to Morogoro.',{exact:true}).waitFor();
      await page.getByLabel('Your area',{exact:true}).fill('m');
      assert.equal(await page.locator('.fc-area-result .is-yes').count(),0,'A partial city name is not confirmed coverage');
    }
  }
  await page.goto('http://127.0.0.1:8000/');
  await page.locator('.hero-backdrops img').evaluate(img=>img.decode());
  assert.equal(await page.locator('.hero-backdrops img').count(),1,'Reduced motion should not rotate photos');
  // Hold the next image request: the current image/text must remain visible.
  let releaseImage;
  const pendingImage=new Promise(resolve=>{releaseImage=resolve;});
  await page.route('**/images/hero/family-*.webp',async route=>{await pendingImage;await route.continue();});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('.hero-backdrops img').nth(1).waitFor({state:'attached',timeout:15000});
  assert.match(await page.locator('.hero-backdrops img.is-active').getAttribute('src'),/market/);
  assert.equal(await page.locator('.hero-copy h1').textContent(),'Good food. A fresh start.');
  releaseImage();
  await page.waitForFunction(()=>document.querySelector('.hero-backdrops img.is-active')?.getAttribute('src')?.includes('family'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/products',route=>route.fulfill({status:503,json:{message:'Temporary catalogue failure'}}));
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.getByText(/Catalogue refresh failed/).waitFor();
  assert.equal(await page.locator('.lower-product-grid .product-card').count(),18,'Refresh failure must retain usable products');
  await page.route('**/api/products',route=>route.fulfill({json:fixture}));
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.getByText(/Catalogue refresh failed/).waitFor({state:'detached'});
  await page.route('**/api/products',route=>route.fulfill({status:503,json:{message:'Temporary catalogue failure'}}));
  await page.goto('http://127.0.0.1:8000/shop');
  await page.getByRole('heading',{name:'The catalogue is unavailable'}).waitFor();
  await page.route('**/api/products',route=>route.fulfill({json:fixture}));
  await page.getByRole('button',{name:'Retry catalogue'}).click();
  await page.getByText('Showing 1–24 of 247 products',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS mobile drawers/focus, wishlist, cart quantities, search empty/clear, sorting, secondary pages, input sizes, reduced motion and slow hero images; no JavaScript errors.');
} finally {await browser.close();}
