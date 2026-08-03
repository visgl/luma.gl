// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {createServer} from 'vite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotPath =
  process.env.SPATIAL_ATLAS_SCREENSHOT ?? join(tmpdir(), 'billion-point-spatial-atlas.png');
const server = await createServer({
  root,
  logLevel: 'error',
  server: {host: '127.0.0.1', port: 0, strictPort: false}
});
let browser;
try {
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  assert(url, 'Vite did not publish a local URL');
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const errors = [];
  const consoleErrors = [];
  page.on('pageerror', error => errors.push(error.stack ?? error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  const smokeUrl = new URL(url);
  smokeUrl.searchParams.set('visual-smoke', 'true');
  await page.goto(smokeUrl.toString(), {waitUntil: 'networkidle'});
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('canvas');
      return canvas instanceof HTMLCanvasElement && canvas.width > 10 && canvas.height > 10;
    },
    undefined,
    {timeout: 30_000}
  );
  await page.waitForTimeout(2_000);
  const state = await page.evaluate(() => ({
    hasWebGPU: Boolean(navigator.gpu),
    canvasCount: document.querySelectorAll('canvas').length,
    hasNavigationToolbar: Boolean(document.querySelector('[data-atlas-navigation]')),
    hasQueryFootprint: Boolean(document.querySelector('[data-atlas-query-footprint]')),
    hasHoverTooltip: Boolean(document.querySelector('[data-atlas-hover-tooltip]')),
    navigationButtonCount: document.querySelectorAll('[data-atlas-action]').length,
    maximumViewScale: document.querySelector('[data-view-scale]')?.getAttribute('max'),
    title: document.title
  }));
  await page.screenshot({path: screenshotPath, fullPage: true, timeout: 60_000});
  assert(state.hasWebGPU, 'Playwright Chromium did not expose WebGPU');
  assert.equal(state.canvasCount, 1, 'atlas renders exactly one canvas');
  assert(state.hasNavigationToolbar, 'atlas exposes its navigation toolbar over the canvas');
  assert(state.hasQueryFootprint, 'atlas exposes a persistent spatial-query footprint');
  assert(state.hasHoverTooltip, 'atlas exposes its GPU-picked point tooltip');
  assert.equal(state.navigationButtonCount, 5, 'atlas exposes tool, zoom, and fit controls');
  assert.equal(state.maximumViewScale, '32', 'atlas exposes detailed taxi-zone zoom');
  assert.match(state.title, /Billion-Point Spatial Atlas/);
  assert.deepEqual(errors, [], `page errors: ${errors.join('\n')}`);
  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('\n')}`);
  assert((await stat(screenshotPath)).size > 10_000, 'visual smoke screenshot was unexpectedly empty');
  process.stdout.write(`Spatial Atlas visual smoke passed: ${screenshotPath}\n`);
} finally {
  await browser?.close();
  await server.close();
}
