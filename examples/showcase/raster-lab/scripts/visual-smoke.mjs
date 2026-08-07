// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir, stat} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {createServer} from 'vite';

const exampleDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotPath = process.env.LURASTER_SCREENSHOT ?? join('/private/tmp', 'luraster-raster-lab.png');
const timeoutMilliseconds = Number(process.env.LURASTER_SMOKE_TIMEOUT_MS ?? 60_000);
const viewportWidth = Number(process.env.LURASTER_VIEWPORT_WIDTH ?? 1440);
const viewportHeight = Number(process.env.LURASTER_VIEWPORT_HEIGHT ?? 900);
const deviceScaleFactor = Number(process.env.LURASTER_DEVICE_SCALE_FACTOR ?? 1);
const server = await createServer({
  root: exampleDirectory,
  logLevel: 'error',
  server: {host: '127.0.0.1', port: 0, strictPort: false}
});

let browser;

try {
  await server.listen();
  const localUrl = server.resolvedUrls?.local[0];
  assert(localUrl, 'Vite did not expose a local raster-lab URL');

  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({
    viewport: {width: viewportWidth, height: viewportHeight},
    deviceScaleFactor
  });
  page.setDefaultTimeout(timeoutMilliseconds);
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const smokeUrl = new URL(localUrl);
  smokeUrl.searchParams.set('visual-smoke', 'true');
  await page.goto(smokeUrl.toString(), {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMilliseconds
  });

  try {
    await page.waitForFunction(
      () => {
        const rasterLab = window.__luRasterLab;
        return Boolean(rasterLab?.ready) && rasterLab.frameCount > 0;
      },
      undefined,
      {timeout: timeoutMilliseconds}
    );
  } catch (error) {
    const startupMessage = await page
      .locator('[data-raster-startup-status]')
      .textContent()
      .catch(() => 'startup status unavailable');
    throw new Error(`Raster lab did not become ready: ${startupMessage}`, {cause: error});
  }

  const initialState = await page.evaluate(() => {
    const rasterLab = window.__luRasterLab;
    return {
      hasWebGPU: Boolean(navigator.gpu),
      canvasCount: document.querySelectorAll('canvas').length,
      histogramBinCount: document.querySelectorAll('[data-raster-histogram] > span').length,
      pixelCount: rasterLab.pixelCount,
      validPixelCount: rasterLab.validPixelCount,
      domain: rasterLab.domain,
      bins: rasterLab.bins,
      mean: rasterLab.mean,
      sum: rasterLab.sum,
      nodeCount: rasterLab.nodeCount,
      executionCount: rasterLab.executionCount,
      frameCount: rasterLab.frameCount,
      canvasWidth: document.querySelector('canvas')?.width,
      canvasHeight: document.querySelector('canvas')?.height
    };
  });

  assert(initialState.hasWebGPU, 'Chromium did not expose WebGPU');
  assert.equal(initialState.canvasCount, 1, 'the raster lab uses exactly one GPU canvas');
  assert.equal(initialState.histogramBinCount, 48, 'the valid-pixel histogram contains 48 bins');
  assert.equal(initialState.pixelCount, 320 * 224, 'visual smoke selects the bounded raster tier');
  assert(initialState.canvasWidth > 300, 'first-frame canvas uses its real drawing-buffer width');
  assert(initialState.canvasHeight > 150, 'first-frame canvas uses its real drawing-buffer height');
  assert(initialState.validPixelCount > 0, 'valid synthetic reflectance reaches the GPU histogram');
  assert(
    initialState.validPixelCount < initialState.pixelCount,
    'clouds and raw nodata are excluded from the GPU histogram'
  );
  assert(
    initialState.nodeCount >= 8,
    'NDVI, contrast, statistics, and histogram form dependent graph work'
  );
  assert.equal(
    initialState.bins.reduce((total, count) => total + count, 0),
    initialState.validPixelCount,
    'the exact GPU count agrees with every histogram bin'
  );
  assert(
    Math.abs(initialState.mean - initialState.sum / initialState.validPixelCount) < 0.00001,
    'the GPU computes the exact masked mean from its sum and count'
  );

  const surfaceBounds = await page.locator('[data-raster-surface]').boundingBox();
  assert(
    surfaceBounds && surfaceBounds.width > 100 && surfaceBounds.height > 100,
    'the false-color raster occupies a visible GPU-rendered map surface'
  );
  const mapCenter = await page.screenshot({
    clip: {
      x: Math.floor(surfaceBounds.x + surfaceBounds.width / 2 - 48),
      y: Math.floor(surfaceBounds.y + surfaceBounds.height / 2 - 48),
      width: 96,
      height: 96
    }
  });
  assert(mapCenter.byteLength > 1_000, 'the first-frame raster viewport contains rendered imagery');

  let previousExecutionCount = initialState.executionCount;
  await page.locator('[data-raster-mode="red"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.mode === 'red' && window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const redState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain,
    validPixelCount: window.__luRasterLab.validPixelCount
  }));
  assert.notDeepEqual(redState.bins, initialState.bins, 'the red layer recomputes its own histogram');
  assert(redState.domain[0] >= 0, 'the red histogram uses its positive reflectance domain');
  assert.equal(
    redState.validPixelCount,
    initialState.validPixelCount,
    'source layers preserve the same cloud, nodata, and denominator validity'
  );
  assert.equal(await page.locator('[data-raster-histogram-axis]').textContent(), 'RED');

  previousExecutionCount = redState.executionCount;
  await page.locator('[data-raster-mode="near-infrared"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.mode === 'near-infrared' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const nearInfraredState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins
  }));
  assert.notDeepEqual(
    nearInfraredState.bins,
    redState.bins,
    'near-infrared has a distinct GPU-computed reflectance distribution'
  );
  assert.equal(await page.locator('[data-raster-histogram-axis]').textContent(), 'NEAR IR');

  previousExecutionCount = nearInfraredState.executionCount;
  await page.locator('[data-raster-mode="ndvi"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.mode === 'ndvi' && window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.deepEqual(
    await page.evaluate(() => window.__luRasterLab.bins),
    initialState.bins,
    'switching back restores the original NDVI distribution'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="contrast"]').fill('1.65');
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const contrastState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain
  }));
  assert.notDeepEqual(
    contrastState.bins,
    initialState.bins,
    'analysis contrast changes actual GPU histogram counts'
  );
  assert.notDeepEqual(
    contrastState.domain,
    initialState.domain,
    'analysis contrast changes the observed GPU-computed extent'
  );

  previousExecutionCount = contrastState.executionCount;
  await page.locator('[data-raster-control="gamma"]').fill('1.55');
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const gammaState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins
  }));
  assert.notDeepEqual(gammaState.bins, contrastState.bins, 'gamma reshapes actual histogram counts');

  previousExecutionCount = gammaState.executionCount;
  await page.locator('[data-raster-control="gamma"]').fill('1');
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="contrast"]').fill('1.15');
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.deepEqual(
    await page.evaluate(() => window.__luRasterLab.bins),
    initialState.bins,
    'restoring contrast and gamma restores the original histogram'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="threshold-enabled"]').check();
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const selectedState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    validPixelCount: window.__luRasterLab.validPixelCount,
    domain: window.__luRasterLab.domain,
    bins: window.__luRasterLab.bins,
    mean: window.__luRasterLab.mean
  }));
  assert(
    selectedState.validPixelCount < initialState.validPixelCount,
    'enabling threshold removes excluded pixels from the actual GPU count'
  );
  assert(
    selectedState.domain[0] >= 0.35 - 0.00001,
    'threshold selection changes the valid histogram extent'
  );
  assert.equal(
    selectedState.bins.reduce((total, count) => total + count, 0),
    selectedState.validPixelCount,
    'thresholded histogram counts exactly match the selected GPU pixel count'
  );
  assert(
    selectedState.mean >= selectedState.domain[0],
    'thresholded mean excludes rejected pixel values'
  );

  previousExecutionCount = selectedState.executionCount;
  await page.locator('[data-raster-control="threshold"]').fill('0.55');
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const stricterSelectedState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    validPixelCount: window.__luRasterLab.validPixelCount,
    domain: window.__luRasterLab.domain
  }));
  assert(
    stricterSelectedState.validPixelCount < selectedState.validPixelCount,
    'raising the threshold actually reduces the selected population'
  );
  assert(
    stricterSelectedState.domain[0] >= 0.55 - 0.00001,
    'the selected histogram minimum follows the live GPU threshold'
  );

  previousExecutionCount = stricterSelectedState.executionCount;
  await page.locator('[data-raster-control="threshold-enabled"]').uncheck();
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.validPixelCount),
    initialState.validPixelCount,
    'disabling threshold restores every valid source pixel'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="otsu"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.automaticThreshold &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const otsuState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    threshold: window.__luRasterLab.threshold,
    domain: window.__luRasterLab.domain,
    validPixelCount: window.__luRasterLab.validPixelCount,
    bins: window.__luRasterLab.bins
  }));
  assert(
    otsuState.threshold >= initialState.domain[0] && otsuState.threshold <= initialState.domain[1],
    'GPU Otsu chooses a threshold inside the original valid domain'
  );
  assert(
    otsuState.validPixelCount > 0 && otsuState.validPixelCount < initialState.validPixelCount,
    'GPU Otsu classifies a nonempty strict subset of valid raster pixels'
  );
  assert(
    otsuState.domain[0] >= otsuState.threshold - 0.00001,
    'the Otsu-selected histogram uses the GPU-computed threshold'
  );
  assert.equal(
    otsuState.bins.reduce((total, count) => total + count, 0),
    otsuState.validPixelCount,
    'Otsu mask, exact count, and displayed histogram share the same population'
  );
  assert.equal(await page.locator('[data-raster-control="otsu"]').getAttribute('aria-pressed'), 'true');

  previousExecutionCount = otsuState.executionCount;
  await page.locator('[data-raster-control="threshold"]').fill('0.55');
  await page.waitForFunction(
    previousCount =>
      !window.__luRasterLab.automaticThreshold &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.validPixelCount),
    stricterSelectedState.validPixelCount,
    'manual threshold overrides Otsu and restores the same deterministic selection'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="threshold-enabled"]').uncheck();
  await page.waitForFunction(
    previousCount => window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="epsilon"]').fill('0.2');
  await page.waitForFunction(
    initialExecutionCount => window.__luRasterLab.executionCount > initialExecutionCount,
    previousExecutionCount,
    {timeout: timeoutMilliseconds}
  );
  const tightenedValidPixelCount = await page.evaluate(() => window.__luRasterLab.validPixelCount);
  assert(
    tightenedValidPixelCount < initialState.validPixelCount,
    'a larger denominator epsilon excludes low-response water pixels'
  );

  await page.locator('[data-raster-control="epsilon"]').fill('0.0001');
  await page.waitForFunction(
    initialValidPixelCount => window.__luRasterLab.validPixelCount === initialValidPixelCount,
    initialState.validPixelCount,
    {timeout: timeoutMilliseconds}
  );
  await page.waitForFunction(
    initialFrameCount => window.__luRasterLab.frameCount > initialFrameCount,
    initialState.frameCount
  );

  await mkdir(dirname(screenshotPath), {recursive: true});
  await page.screenshot({path: screenshotPath, fullPage: true, timeout: timeoutMilliseconds});
  assert((await stat(screenshotPath)).size > 20_000, 'the raster screenshot is unexpectedly empty');
  assert.deepEqual(pageErrors, [], `Browser page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join('\n')}`);

  process.stdout.write(
    `LuRaster visual smoke passed: ${screenshotPath} ` +
      `(${initialState.validPixelCount.toLocaleString()}/${initialState.pixelCount.toLocaleString()} valid pixels, ${initialState.nodeCount} GPU graph nodes)\n`
  );
} finally {
  await browser?.close();
  await server.close();
}
