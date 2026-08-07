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
      morphologyOperation: rasterLab.morphologyOperation,
      morphologyMode: rasterLab.morphologyMode,
      morphologyRadius: rasterLab.morphologyRadius,
      morphologyNoDataPolicy: rasterLab.morphologyNoDataPolicy,
      morphologyBorderMode: rasterLab.morphologyBorderMode,
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
  assert.equal(initialState.morphologyOperation, 'none', 'analytical morphology starts disabled');
  assert.equal(initialState.morphologyMode, 'grayscale', 'morphology defaults to scalar analysis');
  assert.equal(initialState.morphologyRadius, 2, 'morphology exposes its initial structure radius');
  assert.equal(initialState.morphologyNoDataPolicy, 'ignore', 'invalid centers remain masked');
  assert.equal(initialState.morphologyBorderMode, 'clamp', 'morphology defaults to clamped borders');
  assert.equal(
    await page.locator('[data-raster-control="morphology-radius"]').getAttribute('min'),
    '0',
    'the zero-radius identity operation is available interactively'
  );
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

  previousExecutionCount = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.locator('[data-raster-control="epsilon"]').fill('0.0001');
  await page.waitForFunction(
    ({executionCount, validPixelCount}) =>
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.validPixelCount === validPixelCount,
    {executionCount: previousExecutionCount, validPixelCount: initialState.validPixelCount},
    {timeout: timeoutMilliseconds}
  );
  await page.waitForFunction(
    initialFrameCount => window.__luRasterLab.frameCount > initialFrameCount,
    initialState.frameCount
  );

  const updateMorphologyControl = async (selector, value) => {
    const control = page.locator(selector);
    await control.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    const previousCount = await page.evaluate(() => window.__luRasterLab.executionCount);
    if (value === undefined) {
      await control.click();
    } else {
      await control.fill(value);
    }
    try {
      await page.waitForFunction(
        executionCount => window.__luRasterLab.executionCount > executionCount,
        previousCount,
        {timeout: timeoutMilliseconds}
      );
    } catch (error) {
      const state = await page.evaluate(controlSelector => {
        const element = document.querySelector(controlSelector);
        const bounds = element?.getBoundingClientRect();
        return {
          operation: window.__luRasterLab?.morphologyOperation,
          executionCount: window.__luRasterLab?.executionCount,
          status: document.querySelector('[data-raster-status]')?.textContent,
          state: document.querySelector('[data-raster-lab]')?.getAttribute('data-raster-state'),
          pressed: element?.getAttribute('aria-pressed'),
          disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement
            ? element.disabled
            : false,
          bounds: bounds
            ? {x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height}
            : undefined,
          sidebarScroll: document.querySelector('.raster-sidebar')?.scrollTop
        };
      }, selector);
      throw new Error(
        `Raster control ${selector} did not execute: ${JSON.stringify({
          previousCount,
          state,
          pageErrors,
          consoleErrors
        })}`,
        {cause: error}
      );
    }
    return await page.evaluate(() => {
      const rasterLab = window.__luRasterLab;
      return {
        validPixelCount: rasterLab.validPixelCount,
        bins: rasterLab.bins,
        mean: rasterLab.mean,
        nodeCount: rasterLab.nodeCount,
        executionCount: rasterLab.executionCount,
        frameCount: rasterLab.frameCount,
        morphologyOperation: rasterLab.morphologyOperation,
        morphologyMode: rasterLab.morphologyMode,
        morphologyShape: rasterLab.morphologyShape,
        morphologyRadius: rasterLab.morphologyRadius,
        morphologyNoDataPolicy: rasterLab.morphologyNoDataPolicy,
        morphologyBorderMode: rasterLab.morphologyBorderMode,
        morphologyBorderValue: rasterLab.morphologyBorderValue,
        edgeMode: rasterLab.edgeMode,
        smoothingMode: rasterLab.smoothingMode,
        thresholdEnabled: rasterLab.thresholdEnabled,
        automaticThreshold: rasterLab.automaticThreshold,
        threshold: rasterLab.threshold,
        contourLevel: rasterLab.contourLevel,
        contourSegmentCount: rasterLab.contourSegmentCount
      };
    });
  };

  const grayscaleDilation = await updateMorphologyControl('[data-raster-morphology="dilate"]');
  assert.equal(grayscaleDilation.morphologyMode, 'grayscale');
  assert.equal(grayscaleDilation.validPixelCount, initialState.validPixelCount);
  assert(grayscaleDilation.mean > initialState.mean, 'grayscale dilation expands local maxima');
  assert.notDeepEqual(
    grayscaleDilation.bins,
    initialState.bins,
    'grayscale dilation recomputes the resident analytical histogram'
  );
  assert.notEqual(
    grayscaleDilation.contourSegmentCount,
    initialState.contourSegmentCount,
    'scalar contours follow the dilated scientific raster'
  );
  assert(
    grayscaleDilation.nodeCount >= initialState.nodeCount + 1,
    'simple grayscale dilation adds a real GPU morphology pass'
  );

  const grayscaleIdentity = await updateMorphologyControl(
    '[data-raster-control="morphology-radius"]',
    '0'
  );
  assert.equal(grayscaleIdentity.morphologyRadius, 0);
  assert.deepEqual(
    grayscaleIdentity.bins,
    initialState.bins,
    'zero-radius grayscale morphology is an exact analytical identity'
  );
  assert.equal(
    grayscaleIdentity.nodeCount,
    initialState.nodeCount + 1,
    'zero-radius morphology uses one identity pass without a composite pass'
  );

  const grayscaleSquare = await updateMorphologyControl(
    '[data-raster-control="morphology-radius"]',
    '3'
  );
  const grayscaleCross = await updateMorphologyControl(
    '[data-raster-morphology-shape="cross"]'
  );
  assert.equal(grayscaleCross.morphologyShape, 'cross');
  assert.notDeepEqual(
    grayscaleCross.bins,
    grayscaleSquare.bins,
    'the four-connected Manhattan diamond differs from the eight-connected square'
  );
  assert(
    grayscaleCross.mean <= grayscaleSquare.mean + 0.00001,
    'the smaller cross footprint cannot dilate above the enclosing square footprint'
  );

  const grayscaleErosion = await updateMorphologyControl('[data-raster-morphology="erode"]');
  assert(
    grayscaleErosion.mean < initialState.mean,
    'grayscale erosion publishes the local minimum into downstream statistics'
  );
  const grayscaleOpening = await updateMorphologyControl('[data-raster-morphology="open"]');
  assert(
    grayscaleOpening.mean <= initialState.mean + 0.00001,
    'grayscale opening removes narrow positive peaks'
  );
  assert(
    grayscaleOpening.nodeCount >= initialState.nodeCount + 2,
    'opening declares erosion followed by dilation'
  );
  const grayscaleClosing = await updateMorphologyControl('[data-raster-morphology="close"]');
  assert(
    grayscaleClosing.mean >= initialState.mean - 0.00001,
    'grayscale closing fills narrow local depressions'
  );
  assert(
    grayscaleClosing.nodeCount >= initialState.nodeCount + 2,
    'closing declares dilation followed by erosion'
  );

  const strictGrayscale = await updateMorphologyControl(
    '[data-raster-morphology-nodata="propagate"]'
  );
  assert(
    strictGrayscale.validPixelCount < initialState.validPixelCount,
    'strict morphology excludes nodata-adjacent observation halos'
  );
  assert.equal(
    strictGrayscale.bins.reduce((total, count) => total + count, 0),
    strictGrayscale.validPixelCount,
    'strict morphology validity, count, and histogram share the same population'
  );
  const nodataGrayscale = await updateMorphologyControl(
    '[data-raster-morphology-border="nodata"]'
  );
  assert(
    nodataGrayscale.validPixelCount < strictGrayscale.validPixelCount,
    'explicit nodata borders exclude additional edge neighborhoods'
  );
  const ignoredGrayscale = await updateMorphologyControl(
    '[data-raster-morphology-nodata="ignore"]'
  );
  assert.equal(
    ignoredGrayscale.validPixelCount,
    initialState.validPixelCount,
    'ignore policy retains every valid center without reviving masked clouds'
  );
  const reflectedGrayscale = await updateMorphologyControl(
    '[data-raster-morphology-border="reflect"]'
  );
  assert.equal(reflectedGrayscale.morphologyBorderMode, 'reflect');
  await updateMorphologyControl('[data-raster-morphology-border="clamp"]');
  await updateMorphologyControl('[data-raster-morphology="dilate"]');
  const constantGrayscale = await updateMorphologyControl(
    '[data-raster-morphology-border="constant"]'
  );
  assert.equal(constantGrayscale.morphologyBorderMode, 'constant');
  assert.equal(
    await page.locator('[data-raster-control="morphology-border-value"]').isEnabled(),
    true,
    'constant borders expose their calibrated scalar value'
  );
  const lowBorderGrayscale = await updateMorphologyControl(
    '[data-raster-control="morphology-border-value"]',
    '-1'
  );
  const highBorderGrayscale = await updateMorphologyControl(
    '[data-raster-control="morphology-border-value"]',
    '1'
  );
  assert(
    highBorderGrayscale.mean > lowBorderGrayscale.mean,
    'constant border values participate in grayscale extrema'
  );
  assert.notDeepEqual(
    highBorderGrayscale.bins,
    lowBorderGrayscale.bins,
    'changing the constant border changes measured GPU output pixels'
  );
  await updateMorphologyControl('[data-raster-control="morphology-border-value"]', '0');
  await updateMorphologyControl('[data-raster-morphology-border="clamp"]');
  assert.equal(
    await page.locator('[data-raster-control="morphology-border-value"]').isDisabled(),
    true,
    'nonconstant borders disable the irrelevant constant-value control'
  );
  await updateMorphologyControl('[data-raster-morphology-shape="square"]');
  await updateMorphologyControl('[data-raster-control="morphology-radius"]', '2');
  const restoredGrayscale = await updateMorphologyControl('[data-raster-morphology="none"]');
  assert.deepEqual(
    restoredGrayscale.bins,
    initialState.bins,
    'disabling grayscale morphology restores the original resident raster exactly'
  );

  await page.locator('[data-raster-morphology-mode="binary"]').click();
  assert.equal(await page.evaluate(() => window.__luRasterLab.morphologyMode), 'binary');
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.thresholdEnabled),
    false,
    'selecting a binary domain alone does not execute an inactive morphology stage'
  );
  const binaryDilation = await updateMorphologyControl('[data-raster-morphology="dilate"]');
  assert(binaryDilation.thresholdEnabled, 'binary morphology automatically enables its seed mask');
  assert(
    binaryDilation.validPixelCount > stricterSelectedState.validPixelCount,
    'binary dilation expands selected values without treating zero-valued pixels as nodata'
  );
  assert(
    binaryDilation.validPixelCount <= initialState.validPixelCount,
    'binary dilation never selects invalid source centers'
  );
  assert.equal(binaryDilation.contourLevel, 0.5, 'binary contours cross the canonical mask at 0.5');
  assert(binaryDilation.contourSegmentCount > 0, 'binary mask values generate actual isolines');
  assert.equal(
    await page.locator('[data-raster-control="threshold-enabled"]').isDisabled(),
    true,
    'a binary morphology operation always retains its threshold source'
  );
  assert.equal(
    await page.locator('[data-raster-control="contour-level"]').isDisabled(),
    true,
    'binary isolines use a fixed canonical threshold instead of a scalar contour level'
  );

  const binaryIdentity = await updateMorphologyControl(
    '[data-raster-control="morphology-radius"]',
    '0'
  );
  assert.equal(
    binaryIdentity.validPixelCount,
    stricterSelectedState.validPixelCount,
    'zero-radius binary morphology preserves every selected and unselected mask value'
  );
  const binarySquare = await updateMorphologyControl(
    '[data-raster-control="morphology-radius"]',
    '3'
  );
  assert(
    binarySquare.validPixelCount > binaryIdentity.validPixelCount,
    'a larger binary structure expands the selected foreground'
  );
  const binaryCross = await updateMorphologyControl('[data-raster-morphology-shape="cross"]');
  assert(
    binaryCross.validPixelCount < binarySquare.validPixelCount,
    'four-connected binary dilation excludes the square-only diagonal neighborhood'
  );

  const strictBinary = await updateMorphologyControl(
    '[data-raster-morphology-nodata="propagate"]'
  );
  assert(
    strictBinary.validPixelCount < binaryCross.validPixelCount,
    'binary source observation validity remains distinct from false foreground pixels'
  );
  const nodataBinary = await updateMorphologyControl(
    '[data-raster-morphology-border="nodata"]'
  );
  assert(
    nodataBinary.validPixelCount < strictBinary.validPixelCount,
    'binary nodata borders publish rejected edge observations separately from false mask values'
  );
  const recoveredBinary = await updateMorphologyControl(
    '[data-raster-morphology-nodata="ignore"]'
  );
  assert(
    recoveredBinary.validPixelCount > nodataBinary.validPixelCount,
    'ignoring invalid neighbors restores eligible binary centers without filling clouds'
  );
  await updateMorphologyControl('[data-raster-morphology-border="reflect"]');
  const constantBinary = await updateMorphologyControl(
    '[data-raster-morphology-border="constant"]'
  );
  assert.equal(constantBinary.morphologyBorderValue, 0);
  const filledBorderBinary = await updateMorphologyControl(
    '[data-raster-control="morphology-border-value"]',
    '1'
  );
  assert(
    filledBorderBinary.validPixelCount > constantBinary.validPixelCount,
    'nonzero binary constant borders act as true foreground values'
  );
  await updateMorphologyControl('[data-raster-control="morphology-border-value"]', '0');
  await updateMorphologyControl('[data-raster-morphology-border="clamp"]');

  const binaryErosion = await updateMorphologyControl('[data-raster-morphology="erode"]');
  assert(
    binaryErosion.validPixelCount < stricterSelectedState.validPixelCount,
    'binary erosion removes foreground boundary pixels'
  );
  const binaryOpening = await updateMorphologyControl('[data-raster-morphology="open"]');
  assert(
    binaryOpening.validPixelCount <= stricterSelectedState.validPixelCount,
    'binary opening removes narrow foreground islands'
  );
  assert(
    binaryOpening.nodeCount >= binaryIdentity.nodeCount + 1,
    'binary opening composes two resident morphology passes'
  );
  const binaryClosing = await updateMorphologyControl('[data-raster-morphology="close"]');
  assert(
    binaryClosing.validPixelCount >= stricterSelectedState.validPixelCount,
    'binary closing fills narrow gaps in the threshold mask'
  );
  assert.notDeepEqual(
    binaryClosing.bins,
    binaryOpening.bins,
    'binary topology changes the selected scientific-value histogram'
  );
  assert.equal(
    binaryClosing.bins.reduce((total, count) => total + count, 0),
    binaryClosing.validPixelCount,
    'morphed mask, observation validity, histogram, and statistics remain coherent'
  );

  const binaryOtsu = await updateMorphologyControl('[data-raster-control="otsu"]');
  assert(binaryOtsu.automaticThreshold, 'GPU Otsu produces a binary morphology seed on device');
  assert(
    binaryOtsu.validPixelCount > 0 && binaryOtsu.validPixelCount < initialState.validPixelCount,
    'automatic thresholding and binary closing produce a bounded nonempty population'
  );

  const composedSmoothing = await updateMorphologyControl('[data-raster-smoothing="gaussian"]');
  assert.equal(composedSmoothing.smoothingMode, 'gaussian');
  const composedEdge = await updateMorphologyControl('[data-raster-edge="scharr"]');
  assert.equal(composedEdge.edgeMode, 'scharr');
  assert.equal(composedEdge.morphologyOperation, 'close');
  assert.equal(composedEdge.morphologyMode, 'binary');
  assert(composedEdge.automaticThreshold, 'the maximal pipeline retains GPU Otsu thresholding');
  assert(
    composedEdge.validPixelCount > 0 && composedEdge.validPixelCount < initialState.validPixelCount,
    'smoothing, gradient magnitude, Otsu, and morphology compose into a valid population'
  );
  assert(composedEdge.contourSegmentCount > 0, 'the complete pipeline presents binary isolines');
  assert.equal(composedEdge.contourLevel, 0.5, 'the composed topology uses canonical mask contours');
  assert(
    composedEdge.nodeCount >= initialState.nodeCount + 8,
    'smoothing, directional derivatives, GPU Otsu, and closing all contribute real graph passes'
  );
  assert.equal(
    composedEdge.bins.reduce((total, count) => total + count, 0),
    composedEdge.validPixelCount,
    'the maximal GPU pipeline reads only the same coherent aggregate histogram'
  );
  assert(
    (await page.locator('[data-raster-binary-morphology-state]').textContent()).includes('CLOSE'),
    'the scrollable lineage exposes the active binary morphology stage'
  );
  await page.waitForFunction(
    previousFrameCount => window.__luRasterLab.frameCount > previousFrameCount,
    composedSmoothing.frameCount,
    {timeout: timeoutMilliseconds}
  );
  await sidebar.evaluate(element => {
    const morphology = element.querySelector('.raster-morphology-control');
    if (!morphology) return;
    const morphologyBounds = morphology.getBoundingClientRect();
    const sidebarBounds = element.getBoundingClientRect();
    element.scrollTop += morphologyBounds.top - sidebarBounds.top - 8;
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
