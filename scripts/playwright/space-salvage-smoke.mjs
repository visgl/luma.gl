// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'}));
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(process.env.SPACE_SALVAGE_URL || 'http://127.0.0.1:5200/');
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('running'), null, {timeout: 120000});
  await page.locator('button[aria-expanded]').first().click();
  await page.locator('#pause').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('paused'));
  const pausedStatus = await page.locator('#status').textContent();
  await page.waitForTimeout(500);
  if (pausedStatus !== await page.locator('#status').textContent()) throw new Error('Simulation advanced while paused');
  await page.locator('#pause').click();
  await page.locator('button[aria-expanded]').first().click();

  let previousPosition = [-11, 2];
  let previousTime = 0;
  let heldKeys = [];
  for (let iteration = 0; iteration < 70; iteration++) {
    const position = (await page.locator('#navigation').textContent()).match(/-?\d+\.?\d*/g).map(Number);
    const simulationTime = Number((await page.locator('#status').textContent()).match(/[\d.]+/)[0]);
    const elapsed = simulationTime - previousTime;
    const velocity = elapsed > 0 ? position.map((value, index) => (value - previousPosition[index]) / elapsed) : [0, 0];
    const displacement = [-14 - position[0], 8 - position[1]];
    for (const key of heldKeys) await page.keyboard.up(key);
    heldKeys = [];
    if (Math.hypot(...displacement) < 0.55) {
      await page.keyboard.down('Space');
      await page.waitForTimeout(1000);
      await page.keyboard.up('Space');
      break;
    }
    const acceleration = displacement.map((value, index) => value * 1.4 - velocity[index] * 2.3);
    if (Math.abs(acceleration[0]) > 0.5) heldKeys.push(acceleration[0] > 0 ? 'KeyD' : 'KeyA');
    if (Math.abs(acceleration[1]) > 0.5) heldKeys.push(acceleration[1] > 0 ? 'KeyW' : 'KeyS');
    for (const key of heldKeys) await page.keyboard.down(key);
    previousPosition = position;
    previousTime = simulationTime;
    await page.waitForTimeout(200);
  }
  for (const key of heldKeys) await page.keyboard.up(key);
  console.log('Docking position:', await page.locator('#navigation').textContent());
  // First cargo starts at (-7, 6); this viewport spans 44.8 by 28 world units.
  await page.mouse.move((-7 / 22.4 + 1) * 720, (1 - 6 / 14) * 450);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector('#cargo-count').textContent !== '0 / 5', null, {timeout: 45000});
  await page.mouse.up();
  console.log('Recovery:', await page.locator('#cargo-count').textContent());
  if (process.env.SPACE_SALVAGE_SCREENSHOT) await page.screenshot({path: process.env.SPACE_SALVAGE_SCREENSHOT});
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => document.querySelector('#cargo-count').textContent === '0 / 5', null, {timeout: 30000});
  if (await page.locator('#hull').textContent() !== 'HULL 100%') throw new Error('Reset did not restore hull');
  console.log('Reset:', await page.locator('#navigation').textContent());
  const startupError = await page.locator('#startup-error').textContent();
  if (errors.length || startupError) throw new Error(JSON.stringify({errors, startupError}));
} finally {
  await browser.close();
}
