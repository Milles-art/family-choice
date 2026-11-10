import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const products=JSON.parse(fs.readFileSync('artifacts/ui/catalog-snapshot.json','utf8'));
let productGate=null;let productFail=false,user=null,orderFail=true,posts=0;const errors=[];
await context.route('**/api/**',async route=>{
 const p=new URL(route.request().url()).pathname,method=route.request().method();let status=200,data={};
 if(p==='/api/products'){if(productGate)await productGate;data=products;if(productFail){status=503;data={message:'Catalogue unavailable for test'};}}
 else if(p==='/api/settings')data={currency:'TZS',tax_rate:.18,delivery_cents:500000,free_delivery_cents:7500000,mobile_money_enabled:true,mobile_money_instructions:'Test payment instructions'};
 else if(p==='/api/csrf')data={token:'test'};
 else if(p==='/api/me'){data=user??{message:'Unauthenticated'};if(!user)status=401;}
 else if(p==='/api/login'){const body=route.request().postDataJSON();if(body.password==='incorrect'){status=422;data={errors:{email:['The email or password is incorrect.']}};}else data=user={id:1,name:'Test Shopper',email:body.email,is_admin:true};}
 else if(p==='/api/orders'&&method==='POST'){posts++;if(orderFail){status=422;data={message:'Stock changed. Please review your basket.'};}else data={id:1,number:'TEST-001',status:'pending',payment_status:'unpaid',total_cents:713600,items:[],time_slot:'Tomorrow, 10:00 AM - 12:00 PM'};}
 else if(p.endsWith('/orders'))data=[];
 else if(p.startsWith('/api/admin/products/'))data=products[0];
 else if(p==='/api/logout'){user=null;status=204;data=undefined;}
 await route.fulfill({status,contentType:'application/json',body:data===undefined?'':JSON.stringify(data)});
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const checks=[];function ok(condition,label){if(!condition)throw Error(label);checks.push(label);console.log('PASS',label);}
async function overflow(label){const r=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));ok(r.scroll<=r.width,label+' no horizontal overflow');}
await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Good food. A fresh start.'}).waitFor();
ok(await page.locator('.brand-name').textContent()==='FAMILY CHOICE SUPERMARKET','Full corrected brand visible');
await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Shop',exact:true}).click();
await page.locator('.product-card').first().waitFor();
ok(await page.locator('#shop-links').count()===0,'Shop opens catalogue without dropdown');
const minimalCard=page.locator('.product-card').first();
const heartBox=await minimalCard.getByRole('button',{name:/Save .* to wishlist/}).boundingBox();
const cartBox=await minimalCard.getByRole('button',{name:'Add to cart',exact:true}).boundingBox();
ok(heartBox.x<cartBox.x && Math.abs(heartBox.y-cartBox.y)<1,'Product heart left and cart right share action row');
ok(await minimalCard.getByRole('button',{name:'Add to cart',exact:true}).innerText()==='','Product cart control is icon only');
await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Home',exact:true}).click();
ok(await page.getByRole('combobox',{name:'Search products'}).count()===0,'Search field hidden until requested');
await page.getByRole('button',{name:'Search',exact:true}).click();
ok(await page.getByRole('combobox',{name:'Search products'}).evaluate(el=>el===document.activeElement),'Search opens with input focus');
await page.keyboard.press('Escape');
ok(await page.getByRole('button',{name:'Search',exact:true}).evaluate(el=>el===document.activeElement),'Escape closes search and restores icon focus');
for(const width of [360,390,768,1024,1440,1920]){
 await page.setViewportSize({width,height:1000});await overflow('Home '+width);
 const layout=await page.locator('.product-grid,.lower-product-grid').first().evaluate(el=>({width:el.getBoundingClientRect().width,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length}));console.log('GRID',width,JSON.stringify(layout));
 if(width===390||width===1440||width===1920)await page.screenshot({path:`artifacts/ui/home-${width}.png`,fullPage:true});
}
await page.setViewportSize({width:1440,height:1000});
await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Shop',exact:true}).click();await page.getByRole('heading',{name:'All Products',exact:true}).waitFor();
for(const width of [360,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await overflow('Catalogue '+width);}
await page.setViewportSize({width:390,height:1000});await page.getByRole('button',{name:'Filters',exact:true}).click();ok(await page.getByRole('dialog',{name:'Product filters'}).count()===1,'Filter dialog opens');await page.keyboard.press('Escape');ok(await page.getByRole('dialog').count()===0,'Escape closes filters');
await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Search',exact:true}).click();const search=page.getByRole('combobox',{name:'Search products'});await search.fill('banana');await search.press('ArrowDown');await search.press('Enter');await page.locator('main h1').waitFor();ok((await page.locator('main h1').textContent()).toLowerCase().includes('banana'),'Keyboard search selects product');for(const width of [360,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await overflow('Product detail '+width);}await page.setViewportSize({width:1440,height:1000});
await page.getByRole('button',{name:'Search',exact:true}).click();await search.fill('no-matching-product-xyz');await page.getByText('No matching products. Try a category or another name.').waitFor();await search.press('Enter');await page.getByRole('button',{name:'Clear All Filters'}).click();ok(await page.locator('.product-card').count()===39,'Clear filters restores full TSh catalogue');
const first=page.locator('.product-card').first();const name=await first.locator('h3').textContent();await first.getByRole('button',{name:/Save .* to wishlist/}).click();await first.getByRole('button',{name:'Add to cart',exact:true}).click();await page.getByRole('button',{name:/Open cart,/}).click();await page.getByRole('dialog',{name:'Your shopping cart'}).waitFor();
await page.keyboard.press('Shift+Tab');ok(await page.evaluate(()=>!!document.activeElement.closest('[role=dialog]')),'Cart traps keyboard focus');await page.keyboard.press('Escape');ok((await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))).startsWith('Open cart'),'Cart restores focus');
await page.getByRole('button',{name:'Wishlist',exact:true}).first().click();ok(await page.locator('.product-card').count()===1,'Wishlist retains saved product');
await page.getByRole('button',{name:/Open cart,/}).click();await page.getByRole('button',{name:'Proceed to Checkout'}).click();
for(const width of [360,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await overflow('Checkout '+width);}
await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Continue',exact:true}).click();ok(await page.getByText('Enter your full name.',{exact:true}).count()===1,'Checkout field errors appear');
await page.getByLabel('Full name').fill('Test Shopper');await page.getByLabel('Phone number').fill('+255 712 345 678');await page.getByLabel('House, street and landmark').fill('Test Street');await page.getByLabel('Region / city').fill('Dar es Salaam');await page.getByRole('button',{name:'Account menu'}).click();await page.getByRole('button',{name:'Account / Orders',exact:true}).first().click();await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();await page.getByRole('button',{name:/Open cart,/}).click();await page.getByRole('button',{name:'Proceed to Checkout'}).click();ok(await page.getByLabel('Full name').inputValue()==='Test Shopper','Checkout draft survives Account visit');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Tomorrow, 10:00 AM - 12:00 PM',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();ok(await page.getByText(/community contribution/i).count()===0,'Checkout has no contribution controls');
await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Place Order'}).click();await page.getByRole('alert').waitFor();ok(await page.getByRole('heading',{name:'Order Confirmed!'}).count()===0,'Failed server response never shows confirmation');orderFail=false;await page.getByRole('button',{name:'Place Order'}).click();await page.getByRole('heading',{name:'Order Confirmed!'}).waitFor();ok(posts===2,'Checkout retries only after confirmed failure');ok(await page.getByText('Payment is due on delivery or pickup.',{exact:false}).count()>0,'Confirmation distinguishes unpaid order');
await page.getByRole('button',{name:'View Order History'}).click();await page.getByLabel('Email address').fill('shopper@example.test');await page.getByLabel('Password (8+ characters)').fill('incorrect');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('alert').waitFor();ok(await page.getByLabel('Email address').inputValue()==='shopper@example.test','Account retains entered values after failure');await page.getByLabel('Password (8+ characters)').fill('password123');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Manage store'}).waitFor();await page.getByRole('button',{name:'Manage store'}).click();await page.getByRole('heading',{name:'Products and inventory'}).waitFor();
for(const width of [360,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await overflow('Admin '+width);}
await page.setViewportSize({width:390,height:1000});const mobile=page.getByRole('button',{name:'Open navigation menu'});await mobile.click();await page.keyboard.press('Shift+Tab');ok(await page.evaluate(()=>!!document.activeElement.closest('[role=dialog]')),'Mobile menu traps focus');await page.keyboard.press('Escape');ok(await page.getByRole('dialog').count()===0,'Mobile menu Escape');await mobile.click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Delivery Areas'}).click();await overflow('Delivery 390');await mobile.click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Help / Contact'}).click();await overflow('Help 390');
await mobile.click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'New Arrivals',exact:true}).click();await page.setViewportSize({width:1440,height:1000});await overflow('New arrivals 1440');await page.getByRole('button',{name:'About us',exact:true}).first().click();await overflow('About us 1440');await page.getByRole('button',{name:'Recipes',exact:true}).first().click();await overflow('Recipes 1440');await page.getByRole('button',{name:'Privacy notice',exact:true}).last().click();await overflow('Privacy 1440');

// Retained content during failed background refresh, then retry.
await page.getByRole('button',{name:'Home',exact:true}).first().click();productFail=true;
await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
await page.getByText('Catalogue refresh failed.',{exact:false}).waitFor();ok(await page.locator('.product-card').count()>0,'Failed background refresh retains shopping content');productFail=false;await page.getByRole('button',{name:'Retry',exact:true}).first().click();await page.getByText('Catalogue refresh failed.',{exact:false}).waitFor({state:'hidden'});ok(true,'Catalogue retry restores refresh');
await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'artifacts/ui/desktop-preview.png'});await page.setViewportSize({width:390,height:900});await page.screenshot({path:'artifacts/ui/mobile-preview.png'});
let releaseProducts;productGate=new Promise(resolve=>{releaseProducts=resolve;});const loadingPage=await context.newPage();await loadingPage.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await loadingPage.getByRole('status',{name:'Loading deals'}).waitFor();ok(await loadingPage.locator('.skeleton').count()>0,'Real pending request renders reserved skeleton cards');ok(await loadingPage.getByRole('heading',{name:'Good food. A fresh start.'}).isVisible(),'Hero renders while catalogue request is pending');releaseProducts();productGate=null;await loadingPage.getByRole('heading',{name:'Good food. A fresh start.'}).waitFor();await loadingPage.close();
productFail=true;const recovery=await context.newPage();await recovery.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await recovery.getByRole('heading',{name:'The catalogue is unavailable'}).waitFor();ok(true,'Initial catalogue error state');productFail=false;await recovery.getByRole('button',{name:'Retry catalogue'}).click();await recovery.locator('.product-card').first().waitFor();ok(true,'Initial catalogue retry');await recovery.close();
await page.setViewportSize({width:1280,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await overflow('200 percent text resize');await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:320,height:900});await overflow('320px reflow');ok(await page.locator('.product-card').first().evaluate(el=>getComputedStyle(el).transitionDuration)==='0s','Reduced motion disables card transitions');
ok(errors.length===0,'No JavaScript page errors');
ok(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),'Reduced motion preference active');
fs.writeFileSync('artifacts/ui/browser-results.json',JSON.stringify({checks,errors,fixtureBased:true},null,2));await browser.close();console.log('Completed',checks.length,'checks');
