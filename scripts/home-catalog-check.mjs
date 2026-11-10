import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:process.env.HOME_MOTION === 'normal' ? 'no-preference' : 'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:8000/');
  await page.waitForFunction(()=>document.querySelectorAll('.lower-product-grid .product-card').length===18);
  const ids=await page.locator('.lower-product-grid .product-card').evaluateAll(els=>els.map(el=>el.dataset.productId));
  assert.equal(new Set(ids).size,18);
  for(const title of ['Fresh produce','Pantry essentials','Household essentials']) {
    const section=page.getByRole('region',{name:title,exact:true});
    assert.equal(await section.locator('.product-card').count(),6);
    await section.scrollIntoViewIfNeeded();
    for(const img of await section.locator('.product-card img').all())await img.evaluate(el=>el.decode());
    await page.waitForFunction(el=>getComputedStyle(el).opacity==='1',await section.locator('.lower-product-grid').elementHandle());
  }
  fs.mkdirSync('artifacts/product-import',{recursive:true});
  for(const width of [360,390,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);
    if(width===390||width===1440){await page.getByRole('region',{name:'Fresh produce',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/product-import/home-products-${width}.png`});}
  }
  await page.getByRole('region',{name:'Fresh produce',exact:true}).getByRole('button',{name:'View all fresh produce',exact:true}).click();
  await page.getByRole('heading',{name:'Fruits & Vegetables',exact:true}).waitFor();
  assert.ok(page.url().includes('category=produce'));
  assert.deepEqual(errors,[]);
  console.log('PASS: homepage shows 18 unique real products, all images load, 6 viewport widths fit, category destination works, no JavaScript errors.');
}finally{await browser.close();}
