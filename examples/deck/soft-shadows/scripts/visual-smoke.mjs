// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {getPlaywrightLaunchOptions} from '../../../../scripts/playwright/get-playwright-launch-options.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const externalUrl = process.env.SHADOW_TEST_URL;
const server = externalUrl ? null : await createServer({root, logLevel: 'error', server: {host: '127.0.0.1', port: 0}});
await server?.listen();
const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu', softwareGpu: process.platform === 'linux'}));
try {
  const page = await browser.newPage({viewport: {width: 1100, height: 800}, deviceScaleFactor: 1});
  page.setDefaultTimeout(60_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(externalUrl || server.resolvedUrls.local[0], {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.waitForFunction(() => window.riverfrontSoftShadowScene.shadowEffect.frameCount > 2);
  const firstHour = await page.evaluate(() => window.riverfrontSoftShadowScene.settings.hour);
  await page.waitForFunction(hour => window.riverfrontSoftShadowScene.settings.hour > hour + 0.005, firstHour);
  await page.uncheck('#animated');
  const cloudTime = await page.evaluate(() => window.riverfrontSoftShadowScene.cloudSettings.time);
  await page.waitForFunction(time => window.riverfrontSoftShadowScene.cloudSettings.time > time + 0.5, cloudTime);
  assert.equal(await page.evaluate(() => window.riverfrontSoftShadowScene.settings.animated), false);
  // Freeze cloud evolution to compare the effect of cover, without changing sky lighting.
  await page.uncheck('#clouds');
  await page.locator('#cloud-cover').fill('0.75');
  const clearSky = PNG.sync.read(await page.screenshot());
  await page.check('#clouds');
  await page.waitForTimeout(200);
  const cloudySky = PNG.sync.read(await page.screenshot());
  const cloudPixels = countDifferentPixels(clearSky, cloudySky);
  assert(cloudPixels > 2000, `cloud cover changes the visible sky (${cloudPixels} pixels)`);
  await page.locator('#wind-speed').fill('65');
  const cloudStart = await page.evaluate(() => window.riverfrontSoftShadowScene.cloudSettings.time);
  await page.waitForFunction(time => window.riverfrontSoftShadowScene.cloudSettings.time > time + 2, cloudStart);
  const movingCloudPixels = countDifferentPixels(cloudySky, PNG.sync.read(await page.screenshot()));
  assert(movingCloudPixels > 500, `wind visibly moves cloud formations (${movingCloudPixels} pixels)`);
  await page.uncheck('#clouds');
  await page.locator('#hour').fill('8.5');
  await page.waitForTimeout(200);
  if (process.env.SHADOW_THUMBNAIL) await page.screenshot({path: process.env.SHADOW_THUMBNAIL, type: 'jpeg', quality: 85});
  const morningSun = await page.evaluate(() => window.riverfrontSoftShadowScene.sun.direction);
  assert(morningSun[0] > 0 && morningSun[2] > 0, 'morning sun is east and above the horizon');
  const morningShadowed = PNG.sync.read(await page.screenshot({path: join(tmpdir(), 'riverfront-soft-shadows.png')}));
  await page.uncheck('#shadows');
  await page.waitForTimeout(200);
  const morningUnshadowed = PNG.sync.read(await page.screenshot());
  let shadowedPixels = 0;
  for (let vertical = 200; vertical < morningShadowed.height; vertical++) {
    for (let horizontal = 290; horizontal < morningShadowed.width; horizontal++) {
      const offset = (vertical * morningShadowed.width + horizontal) * 4;
      if (morningUnshadowed.data[offset] - morningShadowed.data[offset] > 20) shadowedPixels++;
    }
  }
  assert(shadowedPixels > 1000, `geometric shadows darken visible surfaces (${shadowedPixels} pixels)`);
  await page.check('#shadows');
  await page.locator('#softness').fill('0');
  await page.waitForTimeout(200);
  const hard = PNG.sync.read(await page.screenshot());
  await page.locator('#softness').fill('0.04');
  await page.waitForTimeout(200);
  const soft = PNG.sync.read(await page.screenshot());
  const softeningPixels = countDifferentPixels(hard, soft);
  assert(softeningPixels > 200, `softness changes penumbrae (${softeningPixels} pixels)`);
  await page.locator('#hour').fill('17');
  await page.waitForTimeout(200);
  const eveningSun = await page.evaluate(() => window.riverfrontSoftShadowScene.sun.direction);
  assert(eveningSun[0] < 0 && eveningSun[2] > 0, 'evening sun is west and above the horizon');
  assert(countDifferentPixels(soft, PNG.sync.read(await page.screenshot())) > 5000, 'sun changes lighting and shadow placement');
  for (const quality of ['low', 'cinematic', 'balanced']) {
    await page.selectOption('#quality', quality);
    await page.waitForTimeout(200);
  }
  await page.setViewportSize({width: 900, height: 650});
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.riverfrontSoftShadowScene.diagnostics.error), '');
  await page.click('#look-moon');
  await page.waitForTimeout(200);
  assert(await page.evaluate(() => window.riverfrontSoftShadowScene.moon.direction[2] > 0), 'look at moon chooses an above-horizon moon');
  await page.click('#look-sun');
  await page.locator('#cloud-cover').fill('0.4');
  await page.locator('#wind-speed').fill('18');
  await page.check('#clouds');
  await page.waitForTimeout(200);
  await page.screenshot({path: join(tmpdir(), 'riverfront-sun-clouds.png')});
  if (process.env.SHADOW_THUMBNAIL) await page.screenshot({path: process.env.SHADOW_THUMBNAIL, type: 'jpeg', quality: 85});
  assert.deepEqual(errors, [], 'no browser or GPU errors');
  await page.evaluate(() => window.riverfrontSoftShadowScene.finalize());
  assert.equal(await page.evaluate(() => window.riverfrontSoftShadowScene.shadowEffect.renderer), null, 'shadow resources cleaned up');
  console.log(`WebGPU: sun and cloud animation (${cloudPixels} cover pixels, ${movingCloudPixels} moving pixels), ${shadowedPixels} shadow pixels, ${softeningPixels} penumbra pixels, quality, resize, cleanup passed`);
} finally { await browser.close(); await server?.close(); }

function countDifferentPixels(first, second) {
  let count = 0;
  for (let offset = 0; offset < first.data.length; offset += 4) {
    if (Math.abs(first.data[offset] - second.data[offset]) + Math.abs(first.data[offset + 1] - second.data[offset + 1]) + Math.abs(first.data[offset + 2] - second.data[offset + 2]) > 20) count++;
  }
  return count;
}
