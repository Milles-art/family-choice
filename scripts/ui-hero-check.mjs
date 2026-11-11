import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**',route=>route.request().method()==='GET'?route.continue():route.abort());
await page.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded'});await page.locator('.hero-slideshow').waitFor();const results=[];
if(await page.locator('.hero-controls').count())throw Error('Hero controls must be removed');
for(const width of [360,390,768,1024,1440,1920]){
 await page.setViewportSize({width,height:1000});await page.locator('.hero-backdrops img.is-active').evaluate(image=>image.decode());
 const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.querySelector('.hero-slideshow').getBoundingClientRect().height}));if(result.overflow)throw Error('Overflow '+width);results.push({width,...result});
 if(width===390||width===1440)await page.screenshot({path:`artifacts/ui/hero-${width}.png`});
}
const initial=await page.locator('.hero-copy h1').textContent();await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(0,0);await page.waitForFunction(title=>document.querySelector('.hero-copy h1').textContent!==title,initial,{timeout:15000});
await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Explore deals',exact:true}).first().click();await page.locator('.product-card').first().waitFor();if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync('artifacts/ui/hero-results.json',JSON.stringify({results,errors,noControls:true,autoplay:true,shoppingLink:true},null,2));await browser.close();console.log('Control-free hero checks passed');
