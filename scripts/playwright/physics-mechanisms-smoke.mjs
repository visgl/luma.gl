// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'}));
try {
  const page = await browser.newPage({viewport: {width: 1280, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(process.env.PHYSICS_MECHANISMS_URL || 'http://127.0.0.1:5233/');
  await page.locator('button[aria-expanded]').first().click();
  for (const scene of ['cradle', 'pendulum', 'hinge', 'slider', 'suspension', 'servo']) {
    await page.locator('#scene').selectOption(scene);
    await page.waitForFunction(() => !document.querySelector('#scene')?.disabled);
    await page.waitForTimeout(700);
    await page.waitForFunction(expected => {
      const text = document.querySelector('#status')?.value ?? '';
      const match = text.match(/0 incomplete steps \/ (\d+) total/);
      return match && Number(match[1]) >= (expected === 5 ? 960 : 240) && text.startsWith(`${expected} moving bodies`);
    }, scene === 'cradle' ? 5 : ['pendulum', 'suspension', 'servo'].includes(scene) ? 1 : 2, {timeout: 120000});
    if (await page.locator('#solver').inputValue() !== 'ordered') throw new Error('Mechanisms require the ordered solver');
    console.log(scene, await page.locator('#status').textContent());
  }
  if (errors.length || await page.locator('#startup-error').textContent()) throw new Error(JSON.stringify(errors));
  await page.locator('#reset').click();
  await page.waitForFunction(() => !(document.querySelector('#reset')?.disabled));
  console.log('Reset completed');
} finally {
  await browser.close();
}
