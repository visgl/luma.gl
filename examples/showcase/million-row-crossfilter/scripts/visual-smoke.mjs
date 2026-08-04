// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir, stat} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {createServer} from 'vite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requestedRowCount = readPositiveIntegerEnvironmentVariable('CROSSFILTER_SMOKE_ROWS');
assert(
  requestedRowCount === undefined || (requestedRowCount >= 128 && requestedRowCount <= 1_048_576),
  'CROSSFILTER_SMOKE_ROWS must be between 128 and 1048576'
);
const timeoutMilliseconds =
  readPositiveIntegerEnvironmentVariable('CROSSFILTER_SMOKE_TIMEOUT_MS') ?? 45_000;
const gpuBackend = process.env.CROSSFILTER_GPU_BACKEND ?? 'swiftshader';
assert(
  gpuBackend === 'metal' || gpuBackend === 'swiftshader',
  'CROSSFILTER_GPU_BACKEND must be metal or swiftshader'
);
const histogramDimensions = ['value', 'risk', 'hour'];
const screenshotPath =
  process.env.CROSSFILTER_SCREENSHOT ?? join('/private/tmp', 'luxfilter-showcase.png');
const thumbnailPath = process.env.CROSSFILTER_THUMBNAIL;
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
    args:
      gpuBackend === 'metal'
        ? [
            '--enable-unsafe-webgpu',
            '--use-angle=metal',
            '--enable-gpu',
            '--disable-software-rasterizer'
          ]
        : ['--enable-unsafe-webgpu', '--use-angle=swiftshader']
  });

  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.setDefaultTimeout(timeoutMilliseconds);

  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  const smokeUrl = new URL(url);
  if (requestedRowCount === undefined) {
    smokeUrl.searchParams.set('visual-smoke', 'true');
  } else {
    smokeUrl.searchParams.set('rows', String(requestedRowCount));
  }
  await page.goto(smokeUrl.toString(), {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMilliseconds
  });

  await page.waitForFunction(
    () => {
      const showcase = window.__luxFilterShowcase;
      const canvas = document.querySelector('canvas');
      return (
        Boolean(showcase?.ready) &&
        showcase.frameCount > 0 &&
        canvas instanceof HTMLCanvasElement &&
        canvas.width > 10 &&
        canvas.height > 10
      );
    },
    undefined,
    {timeout: timeoutMilliseconds}
  );

  const initialState = await page.evaluate(dimensions => {
    const showcase = window.__luxFilterShowcase;
    return {
      hasWebGPU: Boolean(navigator.gpu),
      canvasCount: document.querySelectorAll('canvas').length,
      histogramCount: document.querySelectorAll('[data-crossfilter-histogram]').length,
      histogramDimensions: Object.fromEntries(
        dimensions.map(dimension => [
          dimension,
          document.querySelectorAll(`[data-crossfilter-histogram="${dimension}"]`).length
        ])
      ),
      cohortCount: document.querySelectorAll('[data-crossfilter-cohort]').length,
      rowCount: showcase.rowCount,
      selectedCount: showcase.selectedCount,
      frameCount: showcase.frameCount,
      title: document.title
    };
  }, histogramDimensions);

  assert(initialState.hasWebGPU, 'Playwright Chromium did not expose WebGPU');
  assert.equal(initialState.canvasCount, 1, 'the showcase renders exactly one canvas');
  assert.equal(initialState.histogramCount, 3, 'the showcase renders three linked histograms');
  assert.deepEqual(
    initialState.histogramDimensions,
    {value: 1, risk: 1, hour: 1},
    'the showcase exposes exactly one value, risk, and hour histogram'
  );
  assert.equal(initialState.cohortCount, 6, 'the showcase renders six categorical cohorts');
  assert(initialState.rowCount > 0, 'the showcase exposes GPU-resident source rows');
  if (requestedRowCount !== undefined) {
    assert.equal(
      initialState.rowCount,
      requestedRowCount,
      'the showcase honors the requested GPU-resident row count'
    );
  }
  assert.equal(
    initialState.selectedCount,
    initialState.rowCount,
    'all rows are initially selected'
  );
  assert(initialState.frameCount > 0, 'the showcase has rendered at least one frame');
  assert.match(initialState.title, /Million-Row Crossfilter Explorer/);

  const mapSurfaceBounds = await page.locator('[data-map-surface]').boundingBox();
  const scatterSurfaceBounds = await page.locator('[data-scatter-surface]').boundingBox();
  assert(
    mapSurfaceBounds && mapSurfaceBounds.width > 0 && mapSurfaceBounds.height > 0,
    'the map exposes a visible pointer-brush surface'
  );
  assert(
    scatterSurfaceBounds && scatterSurfaceBounds.width > 0 && scatterSurfaceBounds.height > 0,
    'the scatterplot exposes a visible pointer-brush surface'
  );

  await page.evaluate(() => window.__luxFilterShowcase.applyPreset('anomaly'));
  await page.waitForFunction(
    previousSelectedCount => {
      const showcase = window.__luxFilterShowcase;
      return (
        Boolean(showcase?.ready) &&
        showcase.selectedCount !== previousSelectedCount &&
        showcase.selectedCount > 0 &&
        showcase.selectedCount < showcase.rowCount
      );
    },
    initialState.selectedCount,
    {timeout: timeoutMilliseconds}
  );

  const anomalySelectedCount = await page.evaluate(() => window.__luxFilterShowcase.selectedCount);
  assert(anomalySelectedCount > 0, 'the anomaly preset retains matching rows');
  assert(anomalySelectedCount < initialState.rowCount, 'the anomaly preset filters source rows');

  await page.evaluate(() => window.__luxFilterShowcase.clear());
  await page.waitForFunction(
    () => {
      const showcase = window.__luxFilterShowcase;
      return Boolean(showcase?.ready) && showcase.selectedCount === showcase.rowCount;
    },
    undefined,
    {timeout: timeoutMilliseconds}
  );

  const restoredSelectedCount = await page.evaluate(() => window.__luxFilterShowcase.selectedCount);
  assert.equal(restoredSelectedCount, initialState.rowCount, 'clearing restores every source row');

  await page.mouse.move(
    mapSurfaceBounds.x + mapSurfaceBounds.width * 0.25,
    mapSurfaceBounds.y + mapSurfaceBounds.height * 0.15
  );
  await page.mouse.down();
  await page.mouse.move(
    mapSurfaceBounds.x + mapSurfaceBounds.width * 0.75,
    mapSurfaceBounds.y + mapSurfaceBounds.height * 0.85
  );
  await page.mouse.up();
  await page.waitForFunction(
    () => {
      const showcase = window.__luxFilterShowcase;
      return (
        Boolean(showcase?.ready) &&
        showcase.selectedCount > 0 &&
        showcase.selectedCount < showcase.rowCount
      );
    },
    undefined,
    {timeout: timeoutMilliseconds}
  );

  await page.evaluate(() => window.__luxFilterShowcase.clear());
  await page.waitForFunction(
    () => {
      const showcase = window.__luxFilterShowcase;
      return Boolean(showcase?.ready) && showcase.selectedCount === showcase.rowCount;
    },
    undefined,
    {timeout: timeoutMilliseconds}
  );

  await mkdir(dirname(screenshotPath), {recursive: true});
  await page.screenshot({path: screenshotPath, fullPage: true, timeout: timeoutMilliseconds});
  assert(
    (await stat(screenshotPath)).size > 10_000,
    'visual smoke screenshot was unexpectedly empty'
  );

  if (thumbnailPath) {
    await mkdir(dirname(thumbnailPath), {recursive: true});
    await page.screenshot({
      path: thumbnailPath,
      type: 'jpeg',
      quality: 84,
      fullPage: true,
      timeout: timeoutMilliseconds
    });
    assert((await stat(thumbnailPath)).size > 10_000, 'website thumbnail was unexpectedly empty');
  }

  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('\n')}`);

  process.stdout.write(
    `Million-Row Crossfilter Explorer visual smoke passed: ${screenshotPath} ` +
      `(${anomalySelectedCount.toLocaleString()}/${initialState.rowCount.toLocaleString()} anomaly rows)\n`
  );
  if (thumbnailPath) {
    process.stdout.write(`Million-Row Crossfilter Explorer website thumbnail: ${thumbnailPath}\n`);
  }
} finally {
  await browser?.close();
  await server.close();
}

function readPositiveIntegerEnvironmentVariable(name) {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }

  assert.match(value, /^[1-9]\d*$/, `${name} must be a positive integer`);
  const parsedValue = Number(value);
  assert(Number.isSafeInteger(parsedValue), `${name} must be a safe positive integer`);
  return parsedValue;
}
