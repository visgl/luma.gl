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
      edgeMode: rasterLab.edgeMode,
      edgeDirection: rasterLab.edgeDirection,
      contoursEnabled: rasterLab.contoursEnabled,
      contourLevel: rasterLab.contourLevel,
      contourSegmentCount: rasterLab.contourSegmentCount,
      contourOverflow: rasterLab.contourOverflow,
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
  assert.equal(initialState.contoursEnabled, true, 'GPU contour overlays are enabled initially');
  assert.equal(initialState.edgeMode, 'none', 'analytical edge filtering starts disabled');
  assert.equal(initialState.edgeDirection, 'magnitude', 'gradient controls default to magnitude');
  assert(initialState.contourSegmentCount > 0, 'marching squares generates visible GPU isolines');
  assert.equal(initialState.contourOverflow, false, 'the bounded contour output fits its capacity');
  assert(
    (await page.locator('[data-raster-contour-count]').textContent()).includes('CONTOUR SEGMENTS'),
    'the map exposes the GPU-computed contour segment count'
  );

  const sidebar = page.locator('.raster-sidebar');
  const sidebarLayout = await sidebar.evaluate(element => ({
    height: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY
  }));
  assert.equal(sidebarLayout.overflowY, 'auto', 'the analytical sidebar scrolls independently');
  assert(
    sidebarLayout.scrollHeight > sidebarLayout.height,
    'every analytical control and lineage row remains reachable within the viewport'
  );
  const lineageEdge = page.locator('[data-raster-edge-state]');
  await lineageEdge.scrollIntoViewIfNeeded();
  const sidebarBounds = await sidebar.boundingBox();
  const lineageBounds = await lineageEdge.boundingBox();
  assert(
    sidebarBounds &&
      lineageBounds &&
      lineageBounds.y >= sidebarBounds.y - 1 &&
      lineageBounds.y + lineageBounds.height <= sidebarBounds.y + sidebarBounds.height + 1,
    'GPU compute lineage can scroll into the bounded sidebar'
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
  let previousFrameCount = initialState.frameCount;
  const contourSurface = await page.screenshot({
    clip: {
      x: Math.ceil(surfaceBounds.x),
      y: Math.ceil(surfaceBounds.y),
      width: Math.floor(surfaceBounds.width) - 1,
      height: Math.floor(surfaceBounds.height) - 1
    }
  });
  await page.locator('[data-raster-control="contours-enabled"]').uncheck();
  await page.waitForFunction(
    ({executionCount, frameCount}) =>
      !window.__luRasterLab.contoursEnabled &&
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.frameCount > frameCount,
    {executionCount: previousExecutionCount, frameCount: previousFrameCount}
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.contourSegmentCount),
    0,
    'disabling contours removes GPU geometry from the visible summary'
  );
  const plainSurface = await page.screenshot({
    clip: {
      x: Math.ceil(surfaceBounds.x),
      y: Math.ceil(surfaceBounds.y),
      width: Math.floor(surfaceBounds.width) - 1,
      height: Math.floor(surfaceBounds.height) - 1
    }
  });
  assert.notDeepEqual(contourSurface, plainSurface, 'indirect contour geometry changes map pixels');

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="contours-enabled"]').check();
  await page.waitForFunction(
    executionCount =>
      window.__luRasterLab.contoursEnabled && window.__luRasterLab.executionCount > executionCount,
    previousExecutionCount
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.contourSegmentCount),
    initialState.contourSegmentCount,
    're-enabling contours restores the same deterministic GPU geometry'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="contour-level"]').fill('0.05');
  await page.waitForFunction(
    executionCount =>
      window.__luRasterLab.contourLevel === 0.05 &&
      window.__luRasterLab.executionCount > executionCount,
    previousExecutionCount
  );
  assert.notEqual(
    await page.evaluate(() => window.__luRasterLab.contourSegmentCount),
    initialState.contourSegmentCount,
    'changing the isoline value recomputes GPU marching-squares geometry'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  previousFrameCount = await page.evaluate(() => window.__luRasterLab.frameCount);
  await page.locator('[data-raster-control="contour-level"]').fill(String(initialState.contourLevel));
  await page.waitForFunction(
    ({executionCount, frameCount, segmentCount}) =>
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.frameCount > frameCount &&
      window.__luRasterLab.contourSegmentCount === segmentCount,
    {
      executionCount: previousExecutionCount,
      frameCount: previousFrameCount,
      segmentCount: initialState.contourSegmentCount
    }
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
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
  previousFrameCount = await page.evaluate(() => window.__luRasterLab.frameCount);
  await page.locator('[data-raster-edge="sobel"]').click();
  await page.waitForFunction(
    ({executionCount, frameCount}) =>
      window.__luRasterLab.edgeMode === 'sobel' &&
      window.__luRasterLab.edgeDirection === 'magnitude' &&
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.frameCount > frameCount,
    {executionCount: previousExecutionCount, frameCount: previousFrameCount}
  );
  const sobelMagnitudeState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    validPixelCount: window.__luRasterLab.validPixelCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain,
    nodeCount: window.__luRasterLab.nodeCount,
    contourSegmentCount: window.__luRasterLab.contourSegmentCount
  }));
  assert.notDeepEqual(
    sobelMagnitudeState.bins,
    initialState.bins,
    'Sobel magnitude recomputes the GPU analytical distribution'
  );
  assert(
    sobelMagnitudeState.validPixelCount > 0 &&
      sobelMagnitudeState.validPixelCount < initialState.validPixelCount,
    'strict derivatives exclude invalid cloud and nodata neighborhood halos'
  );
  assert(sobelMagnitudeState.domain[0] >= 0, 'gradient magnitude is nonnegative');
  assert(
    sobelMagnitudeState.nodeCount >= initialState.nodeCount + 3,
    'gradient magnitude composes horizontal, vertical, and magnitude GPU passes'
  );
  assert.equal(
    sobelMagnitudeState.bins.reduce((total, count) => total + count, 0),
    sobelMagnitudeState.validPixelCount,
    'derivative histogram excludes every strictly invalid neighborhood'
  );
  assert(
    sobelMagnitudeState.contourSegmentCount > 0 &&
      sobelMagnitudeState.contourSegmentCount !== initialState.contourSegmentCount,
    'indirect contour geometry follows the derived Sobel gradient'
  );
  assert.equal(
    await page.locator('[data-raster-histogram-axis]').textContent(),
    'SOBEL |∇|',
    'the live histogram identifies its derivative quantity'
  );
  const sobelSurface = await page.screenshot({
    clip: {
      x: Math.ceil(surfaceBounds.x),
      y: Math.ceil(surfaceBounds.y),
      width: Math.floor(surfaceBounds.width) - 1,
      height: Math.floor(surfaceBounds.height) - 1
    }
  });
  assert.notDeepEqual(
    sobelSurface,
    contourSurface,
    'GPU edge magnitude changes the actually presented map pixels and overlays'
  );

  previousExecutionCount = sobelMagnitudeState.executionCount;
  await page.locator('[data-raster-edge-direction="x"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeDirection === 'x' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const sobelHorizontalState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain,
    nodeCount: window.__luRasterLab.nodeCount
  }));
  assert(
    sobelHorizontalState.domain[0] < 0 && sobelHorizontalState.domain[1] > 0,
    'horizontal Sobel preserves both signed derivative directions'
  );
  assert.notDeepEqual(
    sobelHorizontalState.bins,
    sobelMagnitudeState.bins,
    'switching to the signed X derivative changes GPU histogram values'
  );
  assert.equal(
    sobelHorizontalState.nodeCount,
    initialState.nodeCount + 1,
    'a directional gradient contributes exactly one GPU stencil pass'
  );

  previousExecutionCount = sobelHorizontalState.executionCount;
  await page.locator('[data-raster-edge-direction="y"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeDirection === 'y' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const sobelVerticalState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins
  }));
  assert.notDeepEqual(
    sobelVerticalState.bins,
    sobelHorizontalState.bins,
    'vertical Sobel measures a genuinely different terrain direction'
  );

  previousExecutionCount = sobelVerticalState.executionCount;
  await page.locator('[data-raster-edge="scharr"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeMode === 'scharr' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const scharrDirectionalState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins
  }));
  assert.notDeepEqual(
    scharrDirectionalState.bins,
    sobelVerticalState.bins,
    'Scharr coefficients produce a distinct signed directional response'
  );

  previousExecutionCount = scharrDirectionalState.executionCount;
  await page.locator('[data-raster-edge-direction="magnitude"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeDirection === 'magnitude' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const scharrMagnitudeState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    contourSegmentCount: window.__luRasterLab.contourSegmentCount
  }));
  assert.notDeepEqual(
    scharrMagnitudeState.bins,
    sobelMagnitudeState.bins,
    'Scharr magnitude retains its independently weighted analytical distribution'
  );

  previousExecutionCount = scharrMagnitudeState.executionCount;
  await page.locator('[data-raster-smoothing="gaussian"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'gaussian' &&
      window.__luRasterLab.edgeMode === 'scharr' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const smoothedScharrState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    nodeCount: window.__luRasterLab.nodeCount,
    contourSegmentCount: window.__luRasterLab.contourSegmentCount
  }));
  assert.notDeepEqual(
    smoothedScharrState.bins,
    scharrMagnitudeState.bins,
    'Gaussian smoothing composes before Scharr magnitude in the analytical graph'
  );
  assert(
    smoothedScharrState.nodeCount >= initialState.nodeCount + 5,
    'smoothing and directional magnitude contribute all five dependent GPU passes'
  );
  assert.notEqual(
    smoothedScharrState.contourSegmentCount,
    scharrMagnitudeState.contourSegmentCount,
    'GPU isolines follow the smoothed gradient field without host geometry readback'
  );

  previousExecutionCount = smoothedScharrState.executionCount;
  await page.locator('[data-raster-edge="laplacian"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeMode === 'laplacian' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const laplacianState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain,
    validPixelCount: window.__luRasterLab.validPixelCount
  }));
  assert(
    laplacianState.domain[0] < 0 && laplacianState.domain[1] > 0,
    'the Laplacian preserves signed positive and negative curvature'
  );
  assert.notDeepEqual(
    laplacianState.bins,
    smoothedScharrState.bins,
    'second-derivative curvature differs from first-derivative magnitude'
  );
  assert(
    laplacianState.validPixelCount < initialState.validPixelCount,
    'Laplacian output also rejects nodata-adjacent neighborhoods'
  );
  assert.equal(
    await page.locator('[data-raster-edge-direction="x"]').isDisabled(),
    true,
    'the isotropic Laplacian disables directional derivative controls'
  );

  previousExecutionCount = laplacianState.executionCount;
  await page.locator('[data-raster-edge="none"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.edgeMode === 'none' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.validPixelCount),
    initialState.validPixelCount,
    'disabling edge detection restores every valid smoothed source observation'
  );
  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-smoothing="none"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'none' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.deepEqual(
    await page.evaluate(() => window.__luRasterLab.bins),
    initialState.bins,
    'disabling smoothing and edge detection restores the original raster exactly'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-smoothing="gaussian"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'gaussian' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const gaussianState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    validPixelCount: window.__luRasterLab.validPixelCount,
    bins: window.__luRasterLab.bins,
    mean: window.__luRasterLab.mean,
    nodeCount: window.__luRasterLab.nodeCount
  }));
  assert.notDeepEqual(
    gaussianState.bins,
    initialState.bins,
    'Gaussian smoothing changes analytical GPU histogram counts'
  );
  assert.equal(
    gaussianState.validPixelCount,
    initialState.validPixelCount,
    'Gaussian smoothing preserves masked clouds and nodata center pixels'
  );
  assert(
    gaussianState.nodeCount >= initialState.nodeCount + 2,
    'Gaussian smoothing adds separate horizontal and vertical GPU graph passes'
  );
  assert.equal(
    gaussianState.bins.reduce((total, count) => total + count, 0),
    gaussianState.validPixelCount,
    'smoothed histogram bins preserve every valid source observation'
  );
  assert.equal(
    await page.locator('[data-raster-control="smoothing-sigma"]').isEnabled(),
    true,
    'Gaussian smoothing exposes its analytical sigma control'
  );

  previousExecutionCount = gaussianState.executionCount;
  await page.locator('[data-raster-control="smoothing-radius"]').fill('4');
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingRadius === 4 &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const widerGaussianState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    mean: window.__luRasterLab.mean
  }));
  assert.notDeepEqual(
    widerGaussianState.bins,
    gaussianState.bins,
    'Gaussian radius changes actual resident raster values and their histogram'
  );

  previousExecutionCount = widerGaussianState.executionCount;
  await page.locator('[data-raster-control="smoothing-sigma"]').fill('2.5');
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingSigma === 2.5 &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const adjustedGaussianState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    domain: window.__luRasterLab.domain,
    mean: window.__luRasterLab.mean
  }));
  assert.notDeepEqual(
    adjustedGaussianState.bins,
    widerGaussianState.bins,
    'Gaussian sigma recomputes normalized neighborhood weights and the histogram'
  );

  previousExecutionCount = adjustedGaussianState.executionCount;
  await page.locator('[data-raster-control="otsu"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.automaticThreshold &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const smoothedOtsuState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    threshold: window.__luRasterLab.threshold,
    validPixelCount: window.__luRasterLab.validPixelCount,
    bins: window.__luRasterLab.bins
  }));
  assert(
    smoothedOtsuState.threshold >= adjustedGaussianState.domain[0] &&
      smoothedOtsuState.threshold <= adjustedGaussianState.domain[1],
    'automatic Otsu derives its GPU threshold from the smoothed raster distribution'
  );
  assert(
    smoothedOtsuState.validPixelCount > 0 &&
      smoothedOtsuState.validPixelCount < initialState.validPixelCount,
    'smoothed pixels compose directly with GPU Otsu and threshold classification'
  );
  assert.equal(
    smoothedOtsuState.bins.reduce((total, count) => total + count, 0),
    smoothedOtsuState.validPixelCount,
    'Gaussian smoothing, Otsu, mask, and histogram share one GPU-resident graph'
  );

  previousExecutionCount = smoothedOtsuState.executionCount;
  await page.locator('[data-raster-control="threshold-enabled"]').uncheck();
  await page.waitForFunction(
    previousCount =>
      !window.__luRasterLab.automaticThreshold &&
      !window.__luRasterLab.thresholdEnabled &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-smoothing="box"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'box' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  const boxState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    bins: window.__luRasterLab.bins,
    validPixelCount: window.__luRasterLab.validPixelCount
  }));
  assert.notDeepEqual(
    boxState.bins,
    adjustedGaussianState.bins,
    'uniform box averaging produces a different analytical distribution than Gaussian weights'
  );
  assert.equal(
    boxState.validPixelCount,
    initialState.validPixelCount,
    'box smoothing keeps invalid center pixels outside the histogram'
  );
  assert.equal(
    await page.locator('[data-raster-control="smoothing-sigma"]').isDisabled(),
    true,
    'uniform box smoothing disables the Gaussian-only sigma control'
  );

  previousExecutionCount = boxState.executionCount;
  await page.locator('[data-raster-control="smoothing-radius"]').fill('2');
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingRadius === 2 &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.notDeepEqual(
    await page.evaluate(() => window.__luRasterLab.bins),
    boxState.bins,
    'box radius recomputes the measured GPU distribution'
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-smoothing="none"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'none' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  assert.deepEqual(
    await page.evaluate(() => window.__luRasterLab.bins),
    initialState.bins,
    'disabling smoothing restores the original unsmoothed GPU histogram exactly'
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.nodeCount),
    initialState.nodeCount,
    'disabling smoothing removes both separable neighborhood passes'
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

  const finalUnsmoothedState = await page.evaluate(() => ({
    executionCount: window.__luRasterLab.executionCount,
    frameCount: window.__luRasterLab.frameCount
  }));
  previousExecutionCount = finalUnsmoothedState.executionCount;
  await page.locator('[data-raster-smoothing="gaussian"]').click();
  await page.waitForFunction(
    previousCount =>
      window.__luRasterLab.smoothingMode === 'gaussian' &&
      window.__luRasterLab.executionCount > previousCount,
    previousExecutionCount
  );
  await page.waitForFunction(
    previousFrameCount => window.__luRasterLab.frameCount > previousFrameCount,
    finalUnsmoothedState.frameCount
  );

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  previousFrameCount = await page.evaluate(() => window.__luRasterLab.frameCount);
  await page.locator('[data-raster-edge="sobel"]').click();
  await page.waitForFunction(
    ({executionCount, frameCount}) =>
      window.__luRasterLab.edgeMode === 'sobel' &&
      window.__luRasterLab.smoothingMode === 'gaussian' &&
      window.__luRasterLab.contoursEnabled &&
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.frameCount > frameCount,
    {executionCount: previousExecutionCount, frameCount: previousFrameCount}
  );
  assert(
    await page.evaluate(() => window.__luRasterLab.contourSegmentCount > 0),
    'the final visual artifact combines smoothing, edge detection, and GPU isolines'
  );
  await sidebar.evaluate(element => {
    element.scrollTop = 0;
  });

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
