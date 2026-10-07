import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
function ok(value,label){if(!value)throw Error(label);checks.push(label);console.log('PASS',label);}
try {
  // Check active features. Honest unavailable/error states must stay visible.
  const banned=/Fresh Choice|FreshCart|Community Impact|My Impact|Generated illustrative concept|Free delivery over TSh 50,000|Delivered in 2 hours|Freshness guaranteed/i;
  for(const path of ['/','/shop','/deals','/about','/delivery','/help','/privacy','/forgot-password']) {
    await page.goto('http://127.0.0.1:8000'+path,{waitUntil:'domcontentloaded'});
    await page.locator('main h1').first().waitFor();
    const text=await page.locator('body').innerText();
    ok(!banned.test(text),path+' has no removed brand/features or unsupported delivery claims');
    ok(text.includes('FAMILY CHOICE SUPERMARKET'),path+' uses the full current brand');
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' fits '+width);
    }
  }
  ok(errors.length===0,'No uncaught JavaScript errors');
} finally {
  fs.mkdirSync('artifacts/launch-copy',{recursive:true});
  fs.writeFileSync('artifacts/launch-copy/results.json',JSON.stringify({checks,errors},null,2));
  await browser.close();
}
