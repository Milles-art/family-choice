import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
fs.mkdirSync('artifacts/editorial-qa',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);console.log('PASS',label)};
await page.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded',timeout:60000});
await page.getByRole('heading',{name:'Shop by aisle',exact:true}).waitFor({timeout:60000});
const apiData=await page.evaluate(async()=>({impact:await (await fetch('/api/impact')).json(),settings:await (await fetch('/api/settings')).json()}));
fs.writeFileSync('artifacts/editorial-qa/configuration-snapshot.json',JSON.stringify(apiData,null,2));
async function verify(label){
 for(const width of [360,390,768,1440,1920]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);});
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('img[src*="/editorial/"]')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),missing:[...document.querySelectorAll('img[src*="/editorial/"]')].filter(i=>!i.alt||!i.width||!i.height||i.loading!=='lazy').length}));
  ok(!state.overflow,`${label} ${width}: no horizontal overflow`);ok(!state.broken.length,`${label} ${width}: editorial images load`);ok(!state.missing,`${label} ${width}: image metadata present`);
  if(width===390||width===1440)await page.screenshot({path:`artifacts/editorial-qa/${label}-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});
}
const headings=await page.locator('main h2').allTextContents();
ok(headings.indexOf('Today’s Deals')<headings.indexOf('Shop by aisle')&&headings.indexOf('Shop by aisle')<headings.indexOf('Recipe inspiration'),'Homepage shopping section order');
ok(await page.locator('main img[src*="category-"]').count()===8,'Eight category images');
ok(await page.locator('main img[src*="promotion-"]').count()===3,'Three promotional images');
ok(await page.locator('main img[src*="recipe-"]').count()===3,'Three recipe images');
await verify('home');
await page.getByRole('button',{name:'Explore Community Impact',exact:true}).click();
await page.getByRole('heading',{name:'Everyday Shopping. Meaningful Community Support.',exact:true}).waitFor();
await page.getByRole('heading',{name:'Optional checkout contributions',exact:true}).waitFor();
ok(await page.getByRole('heading',{name:'Community Food Boxes',exact:true}).count()===0,'Empty food-box configuration is hidden');
ok(await page.locator('main img[src*="community-"]').count()===3,'Three community images');
ok(await page.getByRole('button',{name:/donate|sponsor|support at checkout/i}).count()===0,'No nonfunctional donation buttons');
await verify('community');
await page.getByRole('button',{name:'About us',exact:true}).click();
ok(await page.locator('main img[src*="about-"]').count()===3,'Three About Us concept scenes');await verify('about');
await page.getByRole('button',{name:'Delivery Areas',exact:true}).last().click();await verify('delivery');
await page.getByRole('button',{name:'Recipes',exact:true}).last().click();await verify('recipes');
await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'Shop Now',exact:true}).first().click();await page.getByRole('heading',{name:'Fruits & Vegetables',exact:true}).waitFor();ok(true,'Hero Shop Now navigates to catalogue');
ok(!errors.length,'No JavaScript page errors');
fs.writeFileSync('artifacts/editorial-qa/results.json',JSON.stringify({checks,errors,liveBackend:true},null,2));
await browser.close();

