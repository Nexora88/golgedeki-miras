import { expect, test } from '@playwright/test';

test('GitHub Pages build entrypoint renders the game menu and Three.js canvas', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#world')).toBeVisible();
  await page.waitForTimeout(1200);
  if (pageErrors.length || consoleErrors.length) throw new Error('Startup errors: '+[...pageErrors,...consoleErrors].join(' | '));
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#loading-screen')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('story and campaign panels open on a mobile viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
  await page.locator('#start-game').click();
  await expect(page.locator('.story-overlay')).toBeVisible();
  await page.locator('.story-close').click();
  await page.getByRole('button', { name: 'SEFER DEFTERİ' }).click();
  await expect(page.locator('.campaign-overlay')).toBeVisible();
  await expect(page.getByText('KAYIP BÖLGELER')).toBeVisible();
});
