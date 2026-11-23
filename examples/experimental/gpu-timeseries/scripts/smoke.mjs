// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../../../../scripts/playwright/get-playwright-launch-options.mjs';

const browser = await chromium.launch(getPlaywrightLaunchOptions({backend: 'webgpu', headless: true}));
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text());
  });
  await page.goto(process.env.SIGNAL_ROOM_URL || 'http://127.0.0.1:5183/');
  await page.locator('.signal-room').waitFor();
  const infoBoxToggle = page.locator('[data-luma-example-info-header] button').first();
  await infoBoxToggle.click();
  const zoom = page.getByRole('slider', {name: 'Zoom into history'});
  const pan = page.getByRole('slider', {name: 'Pan through history'});
  assert.equal(await pan.isDisabled(), true);
  await zoom.focus();
  await zoom.press('ArrowRight');
  assert.ok(Number(await zoom.inputValue()) > 0, 'Zoom responds from full history');
  assert.equal(await pan.isEnabled(), true);
  const beforePan = await page.locator('[data-range]').textContent();
  await pan.focus();
  await pan.press('End');
  assert.notEqual(await page.locator('[data-range]').textContent(), beforePan);
  assert.equal(await pan.inputValue(), '1000');
  await page.locator('[data-action="incident"]').click();
  const canvas = page.locator('canvas');
  const rectangle = await canvas.boundingBox();
  assert.ok(rectangle);
  const clickChart = () => canvas.click({position: {x: rectangle.width * 0.51, y: rectangle.height * 0.30}});
  await infoBoxToggle.click();
  await clickChart();
  await infoBoxToggle.click();
  await page.waitForFunction(() => document.querySelector('[data-inspector]').textContent.includes('638,983'));
  await page.locator('[data-action="mode"]').click();
  assert.equal(await page.getByRole('button', {name: '2. Restore peaks'}).count(), 1);
  await page.locator('[data-action="gap"]').click();
  // Wait for a frame to encode the changed viewport before requesting its result.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await infoBoxToggle.click();
  await clickChart();
  await infoBoxToggle.click();
  await page.waitForFunction(() => document.querySelector('[data-inspector]').textContent.includes('No observations'));
  await page.getByRole('button', {name: 'Full history'}).click();
  assert.equal(await zoom.inputValue(), '0');
  assert.equal(await pan.isDisabled(), true);
  const hasGPUTimestamps = (await page.locator('[data-timing-status]').textContent()).includes('sampled');
  await page.getByRole('button', {name: 'GPU Graph', exact: true}).click();
  if (hasGPUTimestamps) {
    await page.waitForFunction(() => Number(document.querySelector('[data-graph-inspector-gpu-samples]').textContent) > 0);
  }
  await page.locator('[data-graph-inspector-content]').waitFor({state: 'visible'});
  assert.ok(Number(await page.locator('[data-graph-inspector-encoding-count]').textContent()) > 1);
  await page.getByRole('button', {name: 'Controls', exact: true}).click();
  await page.locator('[data-action="incident"]').click();
  assert.ok(Number(await zoom.inputValue()) > 0, 'Controls survive tab switches');
  await infoBoxToggle.click();
  assert.equal(await zoom.isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('Signal Room: zoom, pan, incident identity, gap inspection and display mode passed.');
} finally {
  await browser.close();
}
