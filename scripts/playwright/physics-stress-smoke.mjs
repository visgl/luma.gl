// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'}));
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 960}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.PHYSICS_STRESS_URL || 'http://127.0.0.1:5235/');
  await page.getByRole('button', {name: 'Expand info box', exact: true}).first().click();
  await page.waitForFunction(() => document.querySelector('#status')?.textContent?.includes('tick 240/240'), undefined, {timeout: 120000});
  const reports = [];
  for (const scene of ['capacity', 'dense', 'massRatio', 'ballistic', 'continuous']) {
    if (scene !== 'capacity') {
      await page.locator('#scene').selectOption(scene);
      await page.waitForFunction(() => document.querySelector('#status')?.textContent?.includes('tick 240/240'), undefined, {timeout: 120000});
    }
    const status = await page.locator('#status').textContent();
    assert.match(status, /ACCEPTED/);
    assert.equal(await page.locator('#error').textContent(), '');
    reports.push({scene, status});
    if (scene === 'dense') await page.screenshot({path: '/tmp/physics-stress-thumbnail.jpg', type: 'jpeg', quality: 85});
  }
  await page.locator('#pause').click();
  await page.locator('#reset').click();
  await page.waitForFunction(() => !document.querySelector('#reset')?.disabled);
  await page.screenshot({path: '/tmp/physics-stress.png'});
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(reports, null, 2));
} finally {await browser.close();}
