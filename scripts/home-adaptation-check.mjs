import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const checks=[],errors=[];
const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);console.log('PASS',label)};
page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded'});
await page.getByRole('heading',{name:'Shop by aisle',exact:true}).waitFor();
for(const width of [360,390,768,1440,1920]){
 await page.setViewportSize({width,height:1000});
 await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,70));}scrollTo(0,0);await document.fonts.ready;});
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px no horizontal overflow`);
 await page.evaluate(()=>{for(const image of document.querySelectorAll('img[src*="/editorial/"],img[src*="/home-reference/"]'))image.loading='eager';});
 await page.waitForFunction(()=>[...document.querySelectorAll('img[src*="/editorial/"],img[src*="/home-reference/"]')].every(image=>image.complete&&image.naturalWidth),null,{timeout:30000});
 ok(true,`${width}px homepage photographs loaded`);
 if(width===390||width===1440)await page.screenshot({path:`artifacts/home-adaptation/home-${width}.png`,fullPage:true});
}
await page.setViewportSize({width:1440,height:1000});
await page.evaluate(()=>{for(const image of document.querySelectorAll('img[src*="home-reference"]'))image.loading='eager';});
await page.waitForFunction(()=>[...document.querySelectorAll('img[src*="home-reference"]')].every(image=>image.complete&&image.naturalWidth),null,{timeout:30000});
ok(await page.locator('.hero-backdrops img').count()===5,'All five supplied photos load in the hero');
for(const label of ['Fresh produce','Breakfast favourites','Pantry essentials','Delivery or pickup','Family groceries']){
 await page.getByRole('button',{name:`Show ${label}`,exact:true}).click();
 ok(await page.getByRole('button',{name:`Show ${label}`,exact:true}).getAttribute('aria-pressed')==='true',`${label} slide can be selected`);
}
const track=page.locator('.home-carousel-track').first();
await page.getByRole('button',{name:'Next Today’s Deals products'}).click();
await page.waitForFunction(()=>document.querySelector('.home-carousel-track').scrollLeft>0);
ok(await track.evaluate(element=>element.scrollLeft)>0,'Next arrow scrolls actual product carousel');
await page.getByRole('button',{name:'Previous Today’s Deals products'}).click();
await page.waitForFunction(()=>document.querySelector('.home-carousel-track').scrollLeft<2);
ok(await track.evaluate(element=>element.scrollLeft)<2,'Previous arrow returns carousel to the start');
await page.getByRole('button',{name:'Stock the pantry',exact:true}).click();
await page.getByRole('heading',{name:'Pantry Staples',exact:true}).waitFor();ok(true,'Pantry promotion opens correct category');
await page.getByRole('button',{name:'Home',exact:true}).first().click();
await page.getByRole('button',{name:'Shop deals',exact:true}).click();
await page.getByRole('heading',{name:"Today's Best Deals",exact:true}).waitFor();ok(true,'Deals banner opens actual offers');
await page.getByRole('button',{name:'Home',exact:true}).first().click();
ok(!/prices end at midnight|savings land every morning|fresh every morning/i.test(await page.locator('main').innerText()),'No unsupported deal expiry or freshness claims');
ok(await page.locator('.fc-category').count()===8,'Eight original category photographs retained');
ok(await page.locator('img[src*="promotion-"]').count()===3,'Three original promotional photographs retained');
ok(!errors.length,'No JavaScript errors');
await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(800,300);
await page.waitForTimeout(4500);
ok(!(await page.locator('.hero-backdrops img.is-active').getAttribute('src')).includes('fresh-produce-basket'),'Hero continues automatic four-second rotation');
fs.writeFileSync('artifacts/home-adaptation/results.json',JSON.stringify({checks,errors,liveBackend:true},null,2));
await browser.close();

