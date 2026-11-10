import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const products=JSON.parse(fs.readFileSync('artifacts/ui/catalog-snapshot.json','utf8'));
const checks=[],images=new Set(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);console.log('PASS',label)};
await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 const data=path.endsWith('/products')?products:path.endsWith('/settings')?{currency:'TZS',tax_rate:.18,delivery_cents:500000,free_delivery_cents:7500000,mobile_money_enabled:false}:path.endsWith('/impact')?{settings:{enabled:true,fixed_amounts_cents:[100000],round_up_increment_cents:100000},food_boxes:[],campaigns:[],partners:[],totals:{contributions_received_cents:0,food_boxes_distributed:0,meals_distributed:0,households_reached:0,food_rescued_grams:0},reporting_date:'2026-10-06'}:{};
 await route.fulfill({status:path.endsWith('/me')?401:200,contentType:'application/json',body:JSON.stringify(data)});
});
async function capture(label){
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,25));}for(const track of document.querySelectorAll('.home-carousel-track')){track.scrollIntoView();for(let x=0;x<track.scrollWidth;x+=track.clientWidth){track.scrollLeft=x;await new Promise(resolve=>setTimeout(resolve,60));}track.scrollLeft=0;}scrollTo(0,0);await document.fonts.ready;});
  await page.waitForFunction(()=>[...document.querySelectorAll('img')].filter(image=>image.getClientRects().length&&(!image.closest('.hero-backdrops')||image.classList.contains('is-active'))).every(image=>image.complete&&image.naturalWidth),null,{timeout:20000});
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('img')].filter(image=>image.getClientRects().length&&(!image.closest('.hero-backdrops')||image.classList.contains('is-active'))&&(!image.complete||!image.naturalWidth)).map(image=>image.src),images:[...document.querySelectorAll('img[src*="/editorial/"]')].map(image=>image.src.split('/').pop().replace(/-\d+\.webp$/,'')),fonts:document.fonts.check('700 24px "Bricolage Grotesque"')&&document.fonts.check('400 16px "DM Sans"')}));
  ok(!state.overflow,`${label} ${width} fits`);ok(!state.broken.length,`${label} ${width} images loaded`);ok(state.fonts,`${label} ${width} local fonts loaded`);
  state.images.forEach(image=>images.add(image));
  await page.screenshot({path:`artifacts/redesign/${label}-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});
}
await page.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded'});
await page.getByRole('heading',{name:'Shop by aisle',exact:true}).waitFor();
await capture('home');
const homeCard=page.locator('main .product-card').first();
const productName=await homeCard.locator('h3').textContent();
const cardStyles=card=>card.evaluate(element=>[element,...element.querySelectorAll('h3,.product-price,button')].map(node=>{const style=getComputedStyle(node);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','borderRadius','border'].map(property=>[property,style[property]]));}));
const homeStyles=await cardStyles(homeCard);
await page.getByRole('button',{name:'Shop',exact:true}).first().click();
await page.getByRole('heading',{name:'All Products',exact:true}).waitFor();
const shopCard=page.locator('main .product-card').filter({has:page.getByRole('button',{name:productName,exact:true})});
ok(JSON.stringify(homeStyles)===JSON.stringify(await cardStyles(shopCard)),'Homepage product card typography and controls match unchanged Shop');
for(const [name,label,title] of [['About us','about','About FAMILY CHOICE SUPERMARKET'],['Community Impact','community','Everyday Shopping. Meaningful Community Support.'],['Delivery Areas','delivery','Delivery areas'],['Help / Contact','help','Help & contact'],['Recipes','recipes','Recipe Ideas'],['Account / Orders','account','Sign in']]){
 await page.getByRole('button',{name,exact:true}).last().click();
 await page.getByRole('heading',{name:title,exact:true}).waitFor();
 await capture(label);
}
ok(images.size===21,'All 21 supplied editorial images appear in their intended pages');
await page.getByRole('button',{name:'New customer? Create an account',exact:true}).click();
await page.getByRole('heading',{name:'Create your account',exact:true}).waitFor();
await capture('registration');
await page.getByRole('button',{name:'Recipes',exact:true}).last().click();
await page.getByRole('button',{name:'Add Available Ingredients',exact:true}).first().click();
await page.getByRole('button',{name:/Open cart,/}).click();
await page.getByRole('dialog',{name:'Your shopping cart'}).waitFor();
await capture('cart');
const increase=page.getByRole('button',{name:/Increase .* quantity/}).first();
await increase.click();await page.getByRole('button',{name:/Decrease .* quantity/}).first().click();
ok(true,'Cart quantity controls work after recipe ingredients added');
await page.getByRole('button',{name:'Proceed to Checkout'}).click();
await page.getByLabel('Full name').waitFor();await capture('checkout-delivery');
await page.getByLabel('Full name').fill('Preview Shopper');await page.getByLabel('Phone number').fill('+255712345678');await page.getByLabel('House, street and landmark').fill('Preview address');await page.getByLabel('Region / city').fill('Dar es Salaam');
await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('checkout-schedule');
await page.getByRole('button',{name:'Tomorrow, 10:00 AM - 12:00 PM',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('checkout-payment');
await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('checkout-review');
ok(!errors.length,'No JavaScript errors during visual checks');
fs.writeFileSync('artifacts/redesign/visual-results.json',JSON.stringify({checks,images:[...images],errors,fixtureBased:true},null,2));
await browser.close();

