import { test, expect } from '@playwright/test';

test('risk globe, filters, drawer and theme work together', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /shader|WebGL|THREE/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/risk');
  await expect(page.getByRole('heading', { name: 'Risk intelligence' })).toBeVisible();
  await expect(page.locator('[data-globe-status]')).toHaveAttribute('data-globe-status', 'ready', { timeout: 30000 });
  await expect(page.locator('.risk-table tbody tr').first()).toBeVisible();
  const earthCanvas = page.locator('.earth-canvas canvas');
  const movingFrame = await earthCanvas.screenshot();
  await page.waitForTimeout(350);
  expect(movingFrame.equals(await earthCanvas.screenshot()), 'The globe should animate while playing').toBe(false);
  await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume rotation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Reset globe view', exact: true }).click();
  await page.locator('main').evaluate((element) => element.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/risk-desktop.png', fullPage: true });
  await page.locator('.risk-table tbody tr').first().click();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Critical', exact: true }).click();
  await expect(page).toHaveURL(/status=RED/);
  await expect(page.locator('.risk-table tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'All priorities', exact: true }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Medicine', { exact: true }).selectOption('ORS');
  await expect(page).toHaveURL(/drug_code=ORS/);
  await page.getByRole('button', { name: 'Close risk filters' }).click();
  await page.getByRole('button', { name: /switch to light theme/i }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.screenshot({ path: 'test-results/risk-light.png', fullPage: true });
  expect(errors).toEqual([]);
});

for (const width of [1440, 390]) {
  for (const route of ['map', 'capture', 'risk', 'forecast', 'transfers', 'scenario', 'alerts', 'audit', 'federation', 'design-system']) {
    test(`${route} renders at ${width}px without page overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await page.waitForTimeout(600);
      const overflow = await page.locator('main').evaluate((element) => element.scrollWidth > element.clientWidth + 2);
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
      const headerOverflow = await page.locator('header').first().evaluate((element) => element.scrollWidth > element.clientWidth + 2);
      expect(headerOverflow, `Header overflows at ${width}px`).toBe(false);
      await page.screenshot({ path: `test-results/${route}-${width}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test('mobile navigation is keyboard accessible and reduced motion starts paused', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/risk');
  await expect(page.getByRole('button', { name: 'Resume rotation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open mobile navigation drawer' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open mobile navigation drawer' })).toBeFocused();
  await page.getByRole('button', { name: 'Open mobile navigation drawer' }).click();
  await page.getByRole('dialog', { name: 'Navigation', exact: true }).getByRole('link', { name: /forecast/i }).click();
  await expect(page).toHaveURL(/forecast/);
});

test('the risk queue remains usable without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/risk');
  await expect(page.locator('[data-globe-status]')).toHaveAttribute('data-globe-status', 'fallback');
  await expect(page.locator('.risk-table tbody tr').first()).toBeVisible();
  await page.locator('.risk-table tbody tr').first().click();
  await expect(page.getByRole('dialog').first()).toBeVisible();
});

test('texture failures show a usable fallback', async ({ page }) => {
  await page.route('**/textures/earth_normal_2048.jpg', (route) => route.abort());
  await page.goto('/risk');
  await expect(page.locator('[data-globe-status]')).toHaveAttribute('data-globe-status', 'fallback');
  await expect(page.locator('.earth-fallback')).toBeVisible();
  await expect(page.locator('.risk-table tbody tr')).toHaveCount(4);
});

test('the mobile toolbar fits a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/risk');
  await expect(page.getByRole('heading', { name: 'Risk intelligence' })).toBeVisible();
  const header = page.locator('.workspace-header');
  expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Open user profile menu' })).toBeInViewport();
  await page.screenshot({ path: 'test-results/risk-narrow-phone.png' });
});
