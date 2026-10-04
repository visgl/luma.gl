// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {getPlaywrightLaunchOptions} from '../../scripts/playwright/get-playwright-launch-options.mjs';

const kind = process.argv[2] || 'fireflies';
assert(['fireflies', 'hdr-night-lighting', 'global-illumination', 'light-shafts'].includes(kind));
const root = join(dirname(fileURLToPath(import.meta.url)), kind);
const server = await createServer({
  root,
  logLevel: 'error',
  server: {host: '127.0.0.1', port: 0, watch: null}
});
await server.listen();
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({
    headless: true,
    backend: 'webgpu',
    softwareGpu: process.platform === 'linux',
    launchOptions:
      process.platform === 'linux'
        ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']}
        : {}
  })
);
try {
  const page = await browser.newPage({viewport: {width: 1100, height: 800}, deviceScaleFactor: 1});
  page.setDefaultTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0], {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(
    () => document.body.dataset.ready === 'true' || document.body.dataset.ready === 'error'
  );
  assert.equal(await page.evaluate(() => document.body.dataset.ready), 'true', errors.join('\n'));
  await page.waitForFunction(() => window.riverfrontLighting.diagnostics.frames > 4);
  if (kind === 'fireflies') {
    await page.evaluate(() => {
      window.riverfrontLighting.setSetting('speed', 2);
      window.riverfrontLighting.setSetting('debugMode', 3);
    });
    const frameIndex = await page.evaluate(() => window.riverfrontLighting.diagnostics.frames);
    await page.waitForFunction(
      previous => window.riverfrontLighting.diagnostics.frames > previous + 4,
      frameIndex
    );
    const moving = PNG.sync.read(await page.screenshot());
    let movingPixels = 0;
    for (let row = 0; row < moving.height; row++)
      for (let column = 340; column < moving.width; column++) {
        if (moving.data[(row * moving.width + column) * 4 + 2] > 1) movingPixels++;
      }
    assert(movingPixels > 20, `animated cores write object motion (${movingPixels} pixels)`);
    await page.evaluate(() => {
      window.riverfrontLighting.setSetting('speed', 0.6);
      window.riverfrontLighting.setSetting('debugMode', 0);
    });
  }
  // Isolate bloom from exposure adaptation when comparing HDR images.
  if (kind === 'hdr-night-lighting') await page.uncheck('#autoExposure');
  await page.uncheck('#animate');
  await page.waitForFunction(() => !window.riverfrontLighting.deck.props._animate);
  if (process.argv.includes('--thumbnail')) {
    const posterPath = join(root, '../../../website/static/images/examples/deck', `${kind}.jpg`);
    await mkdir(dirname(posterPath), {recursive: true});
    const hiddenControls = await page.addStyleTag({content: 'aside {visibility: hidden;}'});
    await page.screenshot({path: posterPath, type: 'jpeg', quality: 90});
    await hiddenControls.evaluate(element => element.remove());
  }
  const screenshotPath = join(tmpdir(), `riverfront-${kind}.png`);
  await page.screenshot({path: screenshotPath});
  const enabled = PNG.sync.read(await page.screenshot());
  if (kind === 'hdr-night-lighting') await page.uncheck('#bloom');
  else await page.uncheck('#enabled');
  await page.waitForFunction(() => !window.riverfrontLighting.deck.props._animate);
  const disabled = PNG.sync.read(await page.screenshot());
  let changed = 0;
  let totalDifference = 0;
  for (let row = 0; row < enabled.height; row++) {
    for (let column = 340; column < enabled.width; column++) {
      const offset = (row * enabled.width + column) * 4;
      const difference =
        Math.abs(enabled.data[offset] - disabled.data[offset]) +
        Math.abs(enabled.data[offset + 1] - disabled.data[offset + 1]) +
        Math.abs(enabled.data[offset + 2] - disabled.data[offset + 2]);
      totalDifference += difference;
      if (difference > 6) changed++;
    }
  }
  assert(
    changed > 100,
    `${kind} visibly changes scene pixels (${changed}, total ${totalDifference})`
  );
  const diagnostics = await page.evaluate(() => window.riverfrontLighting.diagnostics);
  assert.equal(diagnostics.error, '', 'scene reports no errors');
  assert.equal(diagnostics.backend, 'webgpu');
  await page.selectOption('#buffer-view', '3');
  await page.waitForFunction(() => !window.riverfrontLighting.deck.props._animate);
  const frames = await page.evaluate(() => window.riverfrontLighting.diagnostics.frames);
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(() => window.riverfrontLighting.diagnostics.frames),
    frames,
    'paused scene stops'
  );
  await page.selectOption('#buffer-view', '0');
  await page.click('#center');
  await page.setViewportSize({width: 1000, height: 700});
  await page.waitForFunction(() => !window.riverfrontLighting.deck.props._animate);
  await page.evaluate(() => window.riverfrontLighting.finalize());
  assert(await page.evaluate(() => window.riverfrontLighting.diagnostics.finalized));
  assert.deepEqual(errors, [], 'no browser or GPU errors');
  console.log(
    `${kind}: ${changed} changed pixels, shared buffers, pause, resize and cleanup passed; ${screenshotPath}`
  );
} finally {
  await browser.close();
  await server.close();
}
