import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({headless:true, channel:'msedge'});
const checks = [], errors = [];
const products = await fetch('http://127.0.0.1:8000/api/products').then(r => r.json());
const settings = await fetch('http://127.0.0.1:8000/api/settings').then(r => r.json());
const page = await browser.newPage({viewport:{width:390,height:900}, reducedMotion:'reduce'});
page.on('pageerror', e => errors.push(e.message));
function ok(value, label) { if (!value) throw Error(label); checks.push(label); console.log('PASS', label); }
try {
  let mode = 'loading', release;
  const gate = new Promise(resolve => release = resolve);
  await page.route('**/api/settings', r => r.fulfill({json:settings}));
  await page.route('**/api/products', async r => {
    if (mode === 'loading') await gate;
    if (mode === 'error') return r.fulfill({status:503,json:{message:'Fixture catalogue unavailable.'}});
    return r.fulfill({json:products});
  });
  await page.goto('http://127.0.0.1:5173/shop', {waitUntil:'domcontentloaded'});
  await page.getByRole('status', {name:'Loading content'}).waitFor();
  ok(!await page.locator('.product-card').count(), 'Catalogue shows skeleton before response');
  mode = 'error'; release();
  await page.getByRole('heading', {name:'The catalogue is unavailable',exact:true}).waitFor();
  mode = 'ready'; await page.getByRole('button', {name:'Retry catalogue',exact:true}).click();
  await page.locator('.product-card').first().waitFor(); ok(true, 'Initial error retry restores catalogue');
  mode = 'error'; await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.getByText(/Catalogue refresh failed/).waitFor(); ok(await page.locator('.product-card').count() === products.length, 'Background failure retains existing cards');
  mode = 'ready'; await page.getByRole('button', {name:'Retry',exact:true}).click();
  await page.getByText(/Catalogue refresh failed/).waitFor({state:'detached'}); ok(true, 'Background retry clears error without clearing products');
  const limited = {...products[0], stock:2, inStock:true};
  await page.unroute('**/api/products'); await page.route('**/api/products', r => r.fulfill({json:[limited]}));
  await page.reload({waitUntil:'domcontentloaded'}); const card = page.locator('.product-card').first();
  await card.getByRole('button',{name:'Add to cart',exact:true}).click(); await card.getByRole('button',{name:/Increase .* quantity/}).click();
  ok(await card.getByRole('button',{name:/Increase .* quantity/}).isDisabled(), 'Product stepper stops at server stock');
  await page.route('**/api/csrf', r => r.fulfill({json:{token:'fixture'}}));
  await page.route('**/api/forgot-password', r => r.fulfill({json:{message:'If an account exists, a link will be sent.'}}));
  await page.goto('http://127.0.0.1:5173/forgot-password', {waitUntil:'domcontentloaded'});
  await page.getByLabel('Email address').fill('fixture@example.test'); await page.getByRole('button',{name:'Send reset link',exact:true}).click();
  await page.getByRole('heading',{name:'Check your email',exact:true}).waitFor(); ok(!(await page.locator('main').innerText()).includes('we have sent'), 'Password request does not claim email delivery');
  await page.route('**/api/reset-password', r => r.fulfill({status:422,json:{message:'Invalid token',errors:{token:['This reset link is invalid or expired. Request another link.']}}}));
  await page.goto('http://127.0.0.1:5173/reset-password?token=fixture&email=fixture@example.test', {waitUntil:'domcontentloaded'});
  await page.getByLabel('New password (8+ characters)').fill('fixture-password'); await page.getByLabel('Confirm new password').fill('fixture-password'); await page.getByRole('button',{name:'Update password',exact:true}).click();
  await page.getByRole('button',{name:'Request a new link',exact:true}).waitFor(); ok(await page.getByLabel('New password (8+ characters)').inputValue()==='fixture-password', 'Failed reset preserves values and offers a new link');
  ok(errors.length===0, 'State checks have no uncaught JavaScript errors');
} finally {
  fs.writeFileSync('artifacts/selcom-handoff/state-browser-results.json',JSON.stringify({checks,errors},null,2));
  await browser.close();
}
