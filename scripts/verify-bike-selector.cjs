// Run with: npm exec --yes --package=@playwright/test -- node scripts/verify-bike-selector.cjs
const path = require('node:path');
const modulePaths = (process.env.PATH || '').split(path.delimiter)
  .filter(entry => path.basename(entry) === '.bin').map(entry => path.dirname(entry));
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [process.cwd(), ...modulePaths] }));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BIKE_PREVIEW_URL || 'http://127.0.0.1:3100';
fs.mkdirSync('output/bike-selector', { recursive: true });

async function fixture(browser, type, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const state = { mode: 'ok', taken: [3, 8], queries: [], posts: [], errors: [], release: null, conflict: false };
  page.on('pageerror', error => state.errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.fulfill({ json: [] });
    if (url.pathname === '/api/bookings/available-bikes') {
      state.queries.push(Object.fromEntries(url.searchParams));
      if (state.mode === 'delay') await new Promise(resolve => { state.release = resolve; });
      if (state.mode === 'error') return route.fulfill({ status: 503, json: { error: 'Unavailable' } });
      if (state.mode === 'invalid') return route.fulfill({ json: { takenBikes: 'invalid' } });
      return route.fulfill({ json: { takenBikes: state.taken } });
    }
    if (url.pathname === '/api/bookings/lookup') return route.fulfill({ json: { bookings: [], memberships: [{
      id: `test-${type}`, customer_name: 'Prueba RideOn', customer_email: 'preview@example.com',
      type, credits_total: type === 'pack' ? 3 : null, credits_used: 0,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active', confirmation_number: 'AABB1234',
    }] } });
    if (url.pathname === '/api/memberships/use') {
      state.posts.push(route.request().postDataJSON());
      if (state.conflict) {
        state.conflict = false;
        state.taken.push(9);
        return route.fulfill({ status: 409, json: { error: 'Esta bici acaba de ocuparse. Elige otra.' } });
      }
      return route.fulfill({ json: { confirmation_number: 'TEST1234' } });
    }
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    return route.continue();
  });
  await page.goto(base);
  return { page, context, state };
}

async function selectClass(page, index = 0) {
  // Choose a known position among the list of available schedule slots.
  await page.getByRole('button', { name: 'Seleccionar bici', exact: true }).nth(index).click();
}

async function verifyPage(browser) {
  const { page, context, state } = await fixture(browser, 'pack');
  try {
    await selectClass(page);
    const room = page.getByRole('group', { name: /Mapa del salón/ });
    await expect(room.getByRole('button')).toHaveCount(11);
    await expect(room.getByRole('button', { name: /favorita/ })).toHaveCount(1);
    await expect(room.getByRole('button', { name: /favorita/ })).toHaveAttribute('title', /Bici 04/);
    await expect(room.getByRole('button', { name: /Bicicleta 1, / })).toBeDisabled();
    await expect(room.getByRole('button', { name: /Bicicleta 3, / })).toBeDisabled();
    const bike = room.getByRole('button', { name: /Bicicleta 4, / });
    await expect(bike).toBeEnabled();
    await bike.focus();
    await page.keyboard.press('Enter');
    await expect(bike).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#reservar').screenshot({ path: 'output/bike-selector/individual-desktop.png' });
    await page.getByRole('button', { name: 'Continuar reserva →', exact: true }).click();
    await expect(page.getByText('Bici #04 · Fila 1', { exact: true })).toBeVisible();
    await expect(page.locator('.booking-banner-price')).toHaveText('$200 MXN');
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const sizes = await room.getByRole('button').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      assert(sizes.every(size => size.width >= 44 && size.height >= 44), `Touch targets at ${width}px`);
      assert(await page.locator('#reservar').evaluate(el => el.scrollWidth <= el.clientWidth), `Selector overflow at ${width}px`);
      if (width === 375) await page.locator('.bike-room').screenshot({ path: 'output/bike-selector/individual-mobile.png' });
    }

    state.mode = 'delay';
    await selectClass(page, 1);
    await expect.poll(() => state.release !== null).toBe(true);
    await expect(page.getByRole('button', { name: 'Continuar reserva →' })).toHaveCount(0);
    assert(await room.getByRole('button').evaluateAll(buttons => buttons.every(button => button.disabled)));
    state.mode = 'ok';
    state.release();
    await expect(room.getByRole('button', { name: /Bicicleta 4, / })).toBeEnabled();
    await expect(room.getByRole('button', { name: /Bicicleta 4, / })).toHaveAttribute('aria-pressed', 'false');

    state.mode = 'error';
    await selectClass(page);
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    await expect(page.getByText(/\d+ de 11 disponibles/)).toHaveCount(0);
    state.mode = 'invalid';
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    state.mode = 'ok';
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(room.getByRole('button', { name: /Bicicleta 4, / })).toBeEnabled();

    state.taken = Array.from({ length: 11 }, (_, i) => i + 1);
    await selectClass(page, 1);
    await expect(page.getByText('0 de 11 disponibles', { exact: false })).toBeVisible();
    assert(await room.getByRole('button').evaluateAll(buttons => buttons.every(button => button.disabled)));
    assert(state.queries.every(query => /^\d{4}-\d{2}-\d{2}$/.test(query.class_date)), 'Exact date sent on every availability request');
    assert.deepEqual(state.errors, []);
    return 'Individual: keyboard selection, $200 checkout, 320/375/768/1440px, blocked bikes, loading, date switch, error/retry, invalid response and full room passed.';
  } finally { await context.close(); }
}

async function verifyMembership(browser, type) {
  const { page, context, state } = await fixture(browser, type, type === 'pack' ? 1440 : 390);
  try {
    // Leave a selection behind the dialog to test that the selectors stay independent.
    await selectClass(page);
    await page.getByRole('button', { name: /Bicicleta 4, / }).click();
    await page.getByRole('textbox', { name: 'Correo, teléfono o número de confirmación' }).fill('preview@example.com');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('button', { name: type === 'pack' ? 'Reservar clase con este pack' : 'Reservar clase con membresía', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Reservar clase con membresía', exact: true });
    // The second offered date is always in the future, independent of the time of day.
    await dialog.locator('.mem-date-grid').getByRole('button').nth(1).click();
    await dialog.locator('.mem-slot-list').getByRole('button').first().click();
    const room = dialog.getByRole('group', { name: /Mapa del salón/ });
    await expect(room.getByRole('button')).toHaveCount(11);
    await expect(dialog.getByText(type === 'pack' ? /1 crédito de tu pack/ : /Incluido en tu mensualidad/)).toBeVisible();
    await expect(room.getByRole('button', { name: /favorita/ })).toHaveCount(1);
    await expect(room.getByRole('button', { name: /favorita/ })).toHaveAttribute('title', /Bici 04/);
    const continueButton = dialog.getByRole('button', { name: 'Continuar →', exact: true });
    await expect(continueButton).toBeDisabled();
    const sizesToCheck = [
      [320, 568], [360, 640], [375, 667], [390, 844], [430, 932],
      [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080], [844, 390],
    ];
    for (const [width, height] of sizesToCheck) {
      await page.setViewportSize({ width, height });
      await expect(continueButton).toBeInViewport({ ratio: 1 });
      const sizes = await room.getByRole('button').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      assert(sizes.every(size => size.width >= 44 && size.height >= 44), `Membership touch targets at ${width}px`);
      assert(await dialog.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth), `Membership overflow at ${width}px`);
      assert(await room.evaluate(el => el.scrollWidth <= el.clientWidth), `Room must fit without horizontal scrolling at ${width}px`);
      const bounds = await dialog.locator('.modal').evaluate(modal => {
        const map = modal.querySelector('.bike-layout');
        const footer = modal.querySelector('.sticky-checkout-bar');
        const header = modal.querySelector('.mem-bike-header');
        const rect = el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
        return { map: rect(map), footer: rect(footer), header: rect(header), scrollTop: map.scrollTop,
          bikes: [...modal.querySelectorAll('button[data-state]')].map(rect) };
      });
      assert(bounds.map.top >= bounds.header.bottom - 1, 'Header must not cover the map');
      assert(bounds.map.bottom <= bounds.footer.top + 1, 'Footer must not cover the map');
      if (height >= 568) {
        assert(bounds.bikes.every(bike => bike.top >= bounds.map.top - 1 && bike.bottom <= bounds.map.bottom + 1), `All 11 bikes visible at ${width}x${height}: ${JSON.stringify(bounds)}`);
      } else {
        await room.getByRole('button', { name: /Bicicleta 11, / }).scrollIntoViewIfNeeded();
        await expect(continueButton).toBeInViewport({ ratio: 1 });
      }
      if ([[320,568],[375,667],[1280,720],[844,390]].some(([w,h]) => w === width && h === height)) {
        await dialog.screenshot({ path: `output/bike-selector/${type}-${width}x${height}.png` });
      }
    }
    await page.setViewportSize(type === 'pack' ? { width: 1280, height: 720 } : { width: 375, height: 667 });
    await dialog.locator('.bike-layout').evaluate(el => { el.scrollTop = 0; });
    const beforeSelect = await dialog.locator('.bike-layout').evaluate(el => ({ height: el.clientHeight, scroll: el.scrollTop }));
    await room.getByRole('button', { name: /Bicicleta 9, / }).click();
    await expect(room.getByRole('button', { name: /Bicicleta 9, / })).toHaveAttribute('aria-pressed', 'true');
    const afterSelect = await dialog.locator('.bike-layout').evaluate(el => ({ height: el.clientHeight, scroll: el.scrollTop }));
    assert.deepEqual(afterSelect, beforeSelect, 'Selecting a bike must not move or resize the room');
    await expect(page.locator('#reservar')).toHaveCount(1);
    await expect(page.locator('#reservar').getByRole('button', { name: /Bicicleta 4, / })).toHaveAttribute('aria-pressed', 'true');
    assert(await dialog.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth), 'Dialog must not overflow horizontally');
    await expect(continueButton).toBeInViewport({ ratio: 1 });
    await dialog.screenshot({ path: `output/bike-selector/${type}.png` });
    await continueButton.click();
    await expect(dialog.getByText('#09 · Fila 2', { exact: true })).toBeVisible();
    await expect(dialog.getByText(type === 'pack' ? '1 crédito del pack' : 'Incluido en membresía', { exact: true })).toBeVisible();
    if (type === 'subscription') state.conflict = true;
    await dialog.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
    if (type === 'subscription') {
      await expect(dialog.getByRole('alert')).toContainText('acaba de ocuparse');
      await expect(dialog.getByRole('button', { name: /Bicicleta 9, / })).toBeDisabled();
      await dialog.getByRole('button', { name: /Bicicleta 10, / }).click();
      await continueButton.click();
      await dialog.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
    }
    await expect(dialog.getByRole('heading', { name: '¡Reserva confirmada!' })).toBeVisible();
    const request = state.posts.at(-1);
    assert.equal(request.membership_id, `test-${type}`);
    assert.equal(request.bike_number, type === 'pack' ? 9 : 10);
    assert.equal(request.bike_row, 2);
    assert.equal(request.class_date, state.queries.at(-1).class_date);
    assert.deepEqual(state.errors, []);
    return `${type}: 11 viewport sizes including 320x568 and landscape, all bikes visible on portrait/desktop, no overlap or horizontal scroll, stable footer/selection, only bike 4 is favorite, included access and booking confirmation${type === 'subscription' ? ', plus 409 recovery' : ''} passed.`;
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const results = await Promise.allSettled([verifyPage(browser), verifyMembership(browser, 'pack'), verifyMembership(browser, 'subscription')]);
    for (const result of results) {
      if (result.status === 'fulfilled') console.log('PASS', result.value);
      else { console.error('FAIL', result.reason); process.exitCode = 1; }
    }
    fs.writeFileSync('output/bike-selector/verification.json', JSON.stringify(results.map(result => result.status === 'fulfilled' ? { status: 'passed', detail: result.value } : { status: 'failed', detail: String(result.reason) }), null, 2));
  } finally { await browser.close(); }
})();
