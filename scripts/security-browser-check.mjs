import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/DIGITAL STAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.__cspViolations.push({ directive: event.violatedDirective, blocked: event.blockedURI }));
  });
  await page.route('**/*', async route => {
    if (route.request().isNavigationRequest() && route.request().url().startsWith('http://127.0.0.1:8000/')) {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      if (headers['content-security-policy-report-only']) {
        headers['content-security-policy'] = headers['content-security-policy-report-only'];
        delete headers['content-security-policy-report-only'];
      }
      await route.fulfill({ response, headers });
    } else await route.continue();
  });
  for (const path of ['/', '/shop', '/privacy', '/cart']) {
    await page.goto('http://127.0.0.1:8000' + path, { waitUntil: 'networkidle' });
    await page.locator('main').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const violations = await page.evaluate(() => window.__cspViolations);
    assert.deepEqual(violations, [], 'CSP enforce violations on ' + path);
    checks.push('CSP enforcement: ' + path);
  }
  let cancelled = false;
  const order = { id: 990001, number: 'FC-TEST-ONLY', status: 'pending', payment_status: 'unpaid', payment_method: 'cash', total_cents: 10000, time_slot: 'Test', created_at: new Date().toISOString(), delivery_option: 'pickup', items: [] };
  await page.route('**/api/orders', route => route.fulfill({ json: [{ ...order, status: cancelled ? 'cancelled' : 'pending' }] }));
  await page.route('**/api/orders/990001/cancel', route => { cancelled = true; return route.fulfill({ json: { ...order, status: 'cancelled' } }); });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('http://127.0.0.1:8000/track?order=990001');
  await page.getByRole('button', { name: 'Cancel order', exact: true }).click();
  await page.getByText('Cancelled · Reserved stock has been released.', { exact: true }).waitFor();
  assert.equal(await page.locator('.fc-timeline').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Cancel order', exact: true }).count(), 0);
  checks.push('Confirmed cancellation shows static cancelled state and no active timeline');
  await page.route('**/api/me', route => route.fulfill({ json: { id: 999, name: 'Test administrator', email: 'test@example.test', is_admin: true } }));
  await page.route('**/api/admin/orders', route => route.fulfill({ json: [{ ...order, status: 'cancelled', payment_status: 'paid', payment_method: 'selcom', needs_review: true }] }));
  await page.goto('http://127.0.0.1:8000/account');
  await page.getByRole('button', { name: 'Manage store', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Paid after cancellation: staff review/refund needed' }).waitFor();
  assert.equal(await page.getByRole('combobox', { name: 'Status for FC-TEST-ONLY' }).isDisabled(), true);
  assert.equal(await page.getByRole('combobox', { name: 'Payment for FC-TEST-ONLY' }).isDisabled(), true);
  checks.push('Admin late-payment warning visible; cancelled status and Selcom payment controls disabled');
  console.log(checks.join('\n'));
} finally {
  fs.mkdirSync('artifacts/security-hardening', { recursive: true });
  fs.writeFileSync('artifacts/security-hardening/browser.json', JSON.stringify({ checks }, null, 2));
  await browser.close();
}
