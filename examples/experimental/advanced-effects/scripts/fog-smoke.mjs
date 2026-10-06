// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {createServer} from 'vite';
import {getPlaywrightLaunchOptions} from '../../../../scripts/playwright/get-playwright-launch-options.mjs';
import {setVisualTestPixelScale, captureVisualTestScreenshot} from '../../../../scripts/playwright/visual-test-utils.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const server = await createServer({root, logLevel: 'error', server: {host: '127.0.0.1', port: 0, open: false}});
await server.listen();
const browser = await chromium.launch(getPlaywrightLaunchOptions({
  headless: true,
  backend: 'webgpu',
  softwareGpu: true,
  launchOptions: process.platform === 'linux'
    ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']}
    : {}
}));
function changedPixels(first, second) {
  let count = 0;
  // Only compare the processed half of the scene, away from the controls/divider.
  for (let vertical = 0; vertical < first.height; vertical++) {
    for (let horizontal = Math.ceil(first.width * 0.6); horizontal < first.width; horizontal++) {
      const offset = (vertical * first.width + horizontal) * 4;
      if ([0, 1, 2].some(channel => Math.abs(first.data[offset + channel] - second.data[offset + channel]) > 10)) count++;
    }
  }
  return count;
}
try {
  const page = await browser.newPage({viewport: {width: 1000, height: 700}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  await page.goto(process.env.CITY_FOG_EXAMPLE_URL || server.resolvedUrls.local[0]);
  await page.getByRole('button', {name: 'Visualization Effects', exact: true}).click({timeout: 60_000});
  await setVisualTestPixelScale(page, 'visualizationCity');
  async function selectSetting(name, value) {
    await page.locator(`[data-setting-row-for="${name}"] button`).click();
    await page.getByRole('option', {name: value, exact: true}).click();
  }
  async function setToggle(name, checked) {
    await page.locator(`[data-setting-row-for="${name}"] input`).setChecked(checked);
  }
  async function screenshot(name) {
    await page.waitForTimeout(300);
    return PNG.sync.read(await captureVisualTestScreenshot(page, name ? {path: join(tmpdir(), `city-fog-${name}.png`)} : {}));
  }
  await selectSetting('preset', 'Clean');
  await setToggle('animate', false);
  await page.getByText('Temporal Antialiasing · TAA', {exact: true}).click();
  await setToggle('taaEnabled', false);
  await page.getByText('Height Fog', {exact: true}).click();
  const clear = await screenshot('off');
  await setToggle('fogEnabled', true);
  const stylized = await screenshot('screen-space');
  await selectSetting('fogMode', 'Height (metres)');
  const height = await screenshot('height');
  assert(changedPixels(clear, height) > 2000, 'analytic fog visibly affects the scene');
  assert(changedPixels(stylized, height) > 2000, 'fog model control switches the rendering path');
  const settings = await page.evaluate(() => window.visualizationCity.getAnimationLoopTemplate().settings);
  for (const name of ['animate', 'taaEnabled', 'ssrEnabled', 'ssaoEnabled', 'contactShadowsEnabled']) {
    assert.equal(settings[name], false, `${name}: changing fog preserves the clean, paused preset`);
  }
  const variation = changedPixels(height, await screenshot('static'));
  assert.equal(variation, 0, `paused geometry and fog are stable with temporal AA disabled (${variation} pixels)`);
  await page.mouse.move(820, 500);
  await page.mouse.down();
  await page.mouse.move(900, 550, {steps: 8});
  await page.mouse.up();
  const moved = await screenshot('moved');
  assert(changedPixels(height, moved) > 1000, 'camera orbit changes the scene');
  await page.setViewportSize({width: 900, height: 600});
  const resized = await screenshot('resized');
  await setToggle('fogEnabled', false);
  assert(changedPixels(resized, await screenshot()) > 2000, 'fog remains aligned after camera movement and resize');
  assert.deepEqual(errors, [], 'no browser or GPU errors');
  console.log('Visualization City: fog mode, enable/disable, static rendering, orbit and resize passed');
} finally {
  await browser.close();
  await server.close();
}
