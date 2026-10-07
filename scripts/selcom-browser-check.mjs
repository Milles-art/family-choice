import {createRequire} from 'node:module'; import fs from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});const checks=[],errors=[];const base=process.env.STOREFRONT_URL||'http://127.0.0.1:5173';const catalogue=await fetch('http://127.0.0.1:8000/api/products').then(r=>r.json());const settings=await fetch('http://127.0.0.1:8000/api/settings').then(r=>r.json());
function ok(value,label){if(!value)throw new Error(label);checks.push(label);console.log('PASS',label)}
async function makePage(width=390){const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/products',r=>r.fulfill({json:catalogue}));await p.route('**/api/settings',r=>r.fulfill({json:settings}));return p}
async function fits(p,label){ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' has no overflow')}
function overlaps(a,b){return a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y}
try {
 const page=await makePage();
 for(const width of [360,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/shop',{waitUntil:'domcontentloaded'});await page.locator('.product-card').first().waitFor();await fits(page,'Shop '+width);
  ok(await page.locator('.shop-sidebar').isVisible()===(width>=1024),'Correct sidebar at '+width);
  if(width===390||width===1440){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/selcom-handoff/shop-${width}.png`});}
 }
 await page.setViewportSize({width:360,height:800});await page.goto(base+'/shop',{waitUntil:'domcontentloaded'});const first=page.locator('.product-card').first();await first.waitFor();await first.getByRole('button',{name:'Add to cart',exact:true}).click();await first.locator('.fc-stepper').waitFor();
 const metrics=await first.evaluate(el=>{const card=el.getBoundingClientRect();return [...el.querySelectorAll('.fc-heart,.fc-stepper button')].map(e=>{const r=e.getBoundingClientRect();return {inside:r.left>=card.left&&r.right<=card.right,width:r.width,height:r.height}})});
 ok(metrics.every(m=>m.inside&&m.width>=24&&m.height>=44),'360px heart and stepper fit with usable targets');ok(metrics[0].width>=44,'Wishlist target stays 44px');
 await first.getByRole('button',{name:/Increase .* quantity/}).click();ok(await first.locator('.fc-stepper span').innerText()==='2','Quantity increases');await first.getByRole('button',{name:/Decrease .* quantity/}).click();ok(await first.locator('.fc-stepper span').innerText()==='1','Quantity decreases');
 await first.getByRole('button',{name:/Save .* wishlist/}).click();ok(await first.locator('.fc-heart').getAttribute('aria-pressed')==='true','Wishlist toggles');
 for(const width of [390,768,1024,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,1000));await page.locator('.fc-top.is-visible').waitFor();
  await first.getByRole('button',{name:/Increase .* quantity/}).click();await page.evaluate(()=>scrollTo(0,1000));
  const wa=await page.locator('.fc-whatsapp').boundingBox(),top=await page.locator('.fc-top').boundingBox(),nav=await page.locator('.fc-mobile-nav').isVisible()?await page.locator('.fc-mobile-nav').boundingBox():null;
  const toast=await page.locator('.animate-toast-in').last().boundingBox();
  ok(!overlaps(wa,top)&&!overlaps(wa,nav)&&!overlaps(top,nav)&&!overlaps(toast,wa)&&!overlaps(toast,top),'Floating controls and toast separate at '+width);
 }
 const cartTrigger=page.getByRole('button',{name:/Open cart,/});await cartTrigger.focus();await cartTrigger.click();const cart=page.getByRole('dialog',{name:'Your shopping cart'});await cart.waitFor();ok(!await page.locator('.fc-whatsapp').isVisible(),'WhatsApp hidden behind cart modal');
 await page.keyboard.press('Shift+Tab');ok(await cart.evaluate(el=>el.contains(document.activeElement)),'Cart traps keyboard focus');await page.keyboard.press('Escape');await cart.waitFor({state:'detached'});ok(await cartTrigger.evaluate(el=>el===document.activeElement),'Cart restores focus after Escape');
 await page.setViewportSize({width:390,height:900});const filter=page.getByRole('button',{name:'Filters',exact:true});await filter.click();await page.getByRole('dialog',{name:'Product filters'}).waitFor();await page.keyboard.press('Escape');ok(await filter.evaluate(el=>el===document.activeElement),'Filters restore focus after Escape');
 await page.goto(base+'/shop?search=zzzzzz_no_product',{waitUntil:'domcontentloaded'});await page.getByText('No products found',{exact:true}).waitFor();await page.getByRole('button',{name:'Clear All Filters',exact:true}).click();await page.locator('.product-card').first().waitFor();ok(true,'Empty search clear restores catalogue');
 await page.getByRole('combobox',{name:'Sort products'}).selectOption('price-low');const ids=await page.locator('.product-card').evaluateAll(els=>els.map(e=>e.dataset.productId));const amounts=ids.map(id=>catalogue.find(p=>p.id===id).price);ok(amounts.every((p,i)=>i===0||p>=amounts[i-1]),'Price sorting works');
 for(const [path] of [['/track','Track your order'],['/forgot-password','Forgot your password?'],['/reset-password','This link is not valid'],['/delivery','Your groceries.Your way.'],['/help','Help & contact']]){
  await page.route('**/api/orders',r=>r.fulfill({status:401,json:{message:'Unauthenticated.'}}));await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{level:1}).first().waitFor();ok(new URL(page.url()).pathname===path,'Direct route stays '+path);await fits(page,path+' 390');await page.setViewportSize({width:1440,height:900});await fits(page,path+' 1440');await page.setViewportSize({width:390,height:900});
 }
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.locator('.hero-backdrops .is-active').waitFor();const start=await page.locator('.hero-backdrops .is-active').getAttribute('src');await page.waitForTimeout(4300);ok(start===await page.locator('.hero-backdrops .is-active').getAttribute('src'),'Reduced motion stops hero rotation');ok(await page.locator('.fc-whatsapp').evaluate(el=>getComputedStyle(el).animationName==='none'),'Reduced motion stops new decorative animation');await page.screenshot({path:'artifacts/selcom-handoff/home-mobile.png'});
 await page.close();
 ok(errors.length===0,'No uncaught browser errors');
} finally {fs.writeFileSync('artifacts/selcom-handoff/browser-results.json',JSON.stringify({base,checks,errors},null,2));await browser.close();}
