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
      sourceTile: rasterLab.sourceTile,
      overviewLevel: rasterLab.overviewLevel,
      tileOrigin: rasterLab.tileOrigin,
      coordinateReferenceSystem: rasterLab.coordinateReferenceSystem,
      tileLoadCount: rasterLab.tileLoadCount,
      sourceReadCount: rasterLab.sourceReadCount,
      abortedTileRequestCount: rasterLab.abortedTileRequestCount,
      cacheCapacity: rasterLab.cacheCapacity,
      residentTileCount: rasterLab.residentTileCount,
      residentGraphCount: rasterLab.residentGraphCount,
      residentCpuBytes: rasterLab.residentCpuBytes,
      residentGpuBytes: rasterLab.residentGpuBytes,
      maximumCpuBytes: rasterLab.maximumCpuBytes,
      maximumGpuBytes: rasterLab.maximumGpuBytes,
      cacheHits: rasterLab.cacheHits,
      cacheMisses: rasterLab.cacheMisses,
      cacheEvictions: rasterLab.cacheEvictions,
      graphCompileCount: rasterLab.graphCompileCount,
      graphReuseCount: rasterLab.graphReuseCount,
      pinnedTileCount: rasterLab.pinnedTileCount,
      pinnedGraphCount: rasterLab.pinnedGraphCount,
      haloEnabled: rasterLab.haloEnabled,
      haloRadius: rasterLab.haloRadius,
      haloSourceTileCount: rasterLab.haloSourceTileCount,
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
  assert.equal(initialState.sourceTile, 'full', 'the complete decoded source tile loads first');
  assert.equal(initialState.overviewLevel, 0, 'the source starts at native resolution');
  assert.deepEqual(initialState.tileOrigin, [0, 0], 'the native tile preserves its level-zero origin');
  assert.equal(
    initialState.coordinateReferenceSystem,
    'EPSG:32610',
    'source coordinate-reference metadata survives decoding'
  );
  assert.equal(initialState.tileLoadCount, 1, 'initialization uploads exactly one decoded tile');
  assert.equal(initialState.sourceReadCount, 1, 'initialization decodes the source exactly once');
  assert.equal(initialState.cacheCapacity, 3, 'the tile cache begins with explicit bounded capacity');
  assert.equal(initialState.residentTileCount, 1, 'the initial source owns one resident tile');
  assert.equal(initialState.residentGraphCount, 1, 'the initial analysis compiles one cached graph');
  assert.equal(
    initialState.residentCpuBytes,
    initialState.pixelCount * Uint32Array.BYTES_PER_ELEMENT * 3,
    'decoded red, near-infrared, and their shared validity mask are counted exactly once'
  );
  assert(
    initialState.residentGpuBytes > initialState.residentCpuBytes,
    'GPU residency includes uploaded bands, graph transients, and application-owned outputs'
  );
  assert(
    initialState.residentCpuBytes <= initialState.maximumCpuBytes &&
      initialState.residentGpuBytes <= initialState.maximumGpuBytes,
    'initial tile and graph allocations stay within independent CPU and GPU budgets'
  );
  assert.equal(initialState.cacheHits, 0, 'the initial source cannot be a cache hit');
  assert.equal(initialState.cacheMisses, 1, 'initialization records exactly one source miss');
  assert.equal(initialState.cacheEvictions, 0, 'initialization does not evict resident tiles');
  assert.equal(initialState.graphCompileCount, 1, 'the initial shape compiles exactly one graph');
  assert.equal(initialState.graphReuseCount, 0, 'the initial shape has no previous graph to reuse');
  assert.equal(initialState.pinnedTileCount, 1, 'the displayed source retains an active tile lease');
  assert.equal(initialState.pinnedGraphCount, 1, 'the displayed analysis retains an active graph lease');
  assert.equal(initialState.haloEnabled, false, 'independent tile processing remains the default');
  assert.equal(initialState.haloRadius, 0, 'an independent tile acquires no adjacent source halo');
  assert.equal(initialState.haloSourceTileCount, 1, 'the initial full scene has exactly one source');
  assert.equal(
    await page.locator('[data-raster-control="cache-capacity"]').getAttribute('max'),
    '4',
    'the residency control exposes an explicit maximum tile count'
  );
  assert(
    (await page.locator('[data-raster-cache-capacity]').textContent()).includes('1 / 3'),
    'the interface reports actual resident tile occupancy'
  );
  assert(
    (await page.locator('[data-raster-cache-activity]').textContent()).includes('1 miss'),
    'the interface reports the actual initial cache miss'
  );
  assert(
    (await page.locator('[data-raster-cache-graphs]').textContent()).includes('1 compile'),
    'the interface reports the actual initial graph compilation'
  );
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
  assert(
    (await page.locator('[data-raster-source-origin]').textContent()).includes('EPSG:32610'),
    'the source card displays its actual georeferenced identity'
  );
  assert(
    (await page.locator('.raster-scale').textContent()).includes('single tile · no halo'),
    'the default dashboard truthfully distinguishes independent tile processing from seamless mode'
  );
  assert.equal(
    await page.locator('[data-raster-halo-mode="seamless"]').getAttribute('aria-pressed'),
    'false',
    'cross-tile halo assembly is an explicitly selectable application policy'
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

  const composedFullSurface = await page.screenshot({
    clip: {
      x: Math.ceil(surfaceBounds.x),
      y: Math.ceil(surfaceBounds.y),
      width: Math.floor(surfaceBounds.width) - 1,
      height: Math.floor(surfaceBounds.height) - 1
    }
  });
  const loadSourceSelection = async (selector, tile, level) => {
    const previous = await page.evaluate(() => ({
      loadCount: window.__luRasterLab.tileLoadCount,
      executionCount: window.__luRasterLab.executionCount,
      frameCount: window.__luRasterLab.frameCount
    }));
    const control = page.locator(selector);
    await control.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await control.click();
    await page.waitForFunction(
      ({loadCount, executionCount, frameCount, expectedTile, expectedLevel}) =>
        !window.__luRasterLab.sourceLoading &&
        window.__luRasterLab.tileLoadCount > loadCount &&
        window.__luRasterLab.executionCount > executionCount &&
        window.__luRasterLab.frameCount > frameCount &&
        window.__luRasterLab.sourceTile === expectedTile &&
        window.__luRasterLab.overviewLevel === expectedLevel,
      {...previous, expectedTile: tile, expectedLevel: level},
      {timeout: timeoutMilliseconds}
    );
    return await page.evaluate(() => {
      const rasterLab = window.__luRasterLab;
      return {
        width: rasterLab.width,
        height: rasterLab.height,
        pixelCount: rasterLab.pixelCount,
        validPixelCount: rasterLab.validPixelCount,
        sourceTile: rasterLab.sourceTile,
        overviewLevel: rasterLab.overviewLevel,
        tileOrigin: rasterLab.tileOrigin,
        coordinateReferenceSystem: rasterLab.coordinateReferenceSystem,
        tileLoadCount: rasterLab.tileLoadCount,
        sourceReadCount: rasterLab.sourceReadCount,
        abortedTileRequestCount: rasterLab.abortedTileRequestCount,
        cacheCapacity: rasterLab.cacheCapacity,
        residentTileCount: rasterLab.residentTileCount,
        residentGraphCount: rasterLab.residentGraphCount,
        residentCpuBytes: rasterLab.residentCpuBytes,
        residentGpuBytes: rasterLab.residentGpuBytes,
        maximumCpuBytes: rasterLab.maximumCpuBytes,
        maximumGpuBytes: rasterLab.maximumGpuBytes,
        cacheHits: rasterLab.cacheHits,
        cacheMisses: rasterLab.cacheMisses,
        cacheEvictions: rasterLab.cacheEvictions,
        graphCompileCount: rasterLab.graphCompileCount,
        graphReuseCount: rasterLab.graphReuseCount,
        pinnedTileCount: rasterLab.pinnedTileCount,
        pinnedGraphCount: rasterLab.pinnedGraphCount,
        haloEnabled: rasterLab.haloEnabled,
        haloRadius: rasterLab.haloRadius,
        haloLevelZeroRadius: rasterLab.haloLevelZeroRadius,
        haloCoreBounds: rasterLab.haloCoreBounds,
        haloAvailableBounds: rasterLab.haloAvailableBounds,
        haloSourceTileCount: rasterLab.haloSourceTileCount,
        haloTransferCount: rasterLab.haloTransferCount,
        nodeCount: rasterLab.nodeCount,
        executionCount: rasterLab.executionCount,
        sum: rasterLab.sum,
        edgeMode: rasterLab.edgeMode,
        smoothingMode: rasterLab.smoothingMode,
        morphologyOperation: rasterLab.morphologyOperation,
        morphologyMode: rasterLab.morphologyMode,
        automaticThreshold: rasterLab.automaticThreshold,
        contourLevel: rasterLab.contourLevel,
        contourSegmentCount: rasterLab.contourSegmentCount,
        bins: rasterLab.bins
      };
    });
  };

  const previousNativeResidency = await page.evaluate(() => ({
    sourceReadCount: window.__luRasterLab.sourceReadCount,
    cacheMisses: window.__luRasterLab.cacheMisses,
    graphCompileCount: window.__luRasterLab.graphCompileCount
  }));
  const westernTile = await loadSourceSelection('[data-raster-source-tile="west"]', 'west', 0);
  assert.equal(westernTile.width, 160, 'the explicit western tile clips the source width');
  assert.equal(westernTile.height, 224, 'the western tile retains full native source height');
  assert.equal(westernTile.pixelCount, 160 * 224, 'only the selected tile is uploaded and analyzed');
  assert.equal(
    westernTile.sourceReadCount,
    previousNativeResidency.sourceReadCount + 1,
    'an uncached western tile performs exactly one application-source decode'
  );
  assert.equal(
    westernTile.cacheMisses,
    previousNativeResidency.cacheMisses + 1,
    'the western tile records one actual residency miss'
  );
  assert.equal(westernTile.residentTileCount, 2, 'the full and western tiles remain independently resident');
  assert.equal(
    westernTile.graphCompileCount,
    previousNativeResidency.graphCompileCount + 1,
    'a smaller tile requires one distinct compatible compiled graph shape'
  );
  assert(
    westernTile.residentCpuBytes <= westernTile.maximumCpuBytes &&
      westernTile.residentGpuBytes <= westernTile.maximumGpuBytes,
    'the full and western tiles stay within both explicit cache byte budgets'
  );
  assert.deepEqual(westernTile.tileOrigin, [0, 0]);
  assert.equal(westernTile.smoothingMode, 'gaussian', 'tile swaps retain selected spatial smoothing');
  assert.equal(westernTile.edgeMode, 'scharr', 'tile swaps retain selected gradient analysis');
  assert.equal(westernTile.morphologyOperation, 'close', 'tile swaps retain morphology settings');
  assert.equal(westernTile.morphologyMode, 'binary', 'binary morphology survives source changes');
  assert(westernTile.automaticThreshold, 'the new tile computes its own resident Otsu threshold');
  assert.equal(westernTile.contourLevel, 0.5, 'binary tile contours retain canonical mask semantics');
  assert(westernTile.contourSegmentCount > 0, 'the selected tile generates its own GPU isolines');
  assert.notDeepEqual(
    westernTile.bins,
    composedEdge.bins,
    'the decoded western window recomputes a distinct histogram'
  );
  assert.equal(
    westernTile.bins.reduce((total, count) => total + count, 0),
    westernTile.validPixelCount,
    'the selected tile preserves coherent masked histogram statistics'
  );
  const westernSurface = await page.screenshot({
    clip: {
      x: Math.ceil(surfaceBounds.x),
      y: Math.ceil(surfaceBounds.y),
      width: Math.floor(surfaceBounds.width) - 1,
      height: Math.floor(surfaceBounds.height) - 1
    }
  });
  assert.notDeepEqual(
    westernSurface,
    composedFullSurface,
    'switching source tiles changes real GPU-presented raster pixels'
  );

  const easternTile = await loadSourceSelection('[data-raster-source-tile="east"]', 'east', 0);
  assert.equal(easternTile.width, 160);
  assert.equal(
    easternTile.sourceReadCount,
    westernTile.sourceReadCount + 1,
    'an uncached eastern tile decodes exactly once'
  );
  assert.equal(
    easternTile.graphCompileCount,
    westernTile.graphCompileCount,
    'equally sized eastern and western windows reuse the exact compiled graph'
  );
  assert.equal(
    easternTile.graphReuseCount,
    westernTile.graphReuseCount + 1,
    'changing tile origin increments actual compatible graph reuse'
  );
  assert.equal(easternTile.residentTileCount, 3, 'all visited native windows fit the configured capacity');
  assert(
    easternTile.residentCpuBytes <= easternTile.maximumCpuBytes &&
      easternTile.residentGpuBytes <= easternTile.maximumGpuBytes,
    'three independently resident source tiles remain within CPU and GPU budgets'
  );
  assert.deepEqual(
    easternTile.tileOrigin,
    [160, 0],
    'the eastern native tile preserves its exact level-zero origin'
  );
  assert.notDeepEqual(
    easternTile.bins,
    westernTile.bins,
    'different decoded source windows retain distinct scientific distributions'
  );
  assert(
    (await page.locator('[data-raster-source-origin]').textContent()).includes('160'),
    'the application exposes its selected tile origin in the dashboard'
  );

  const revisitedWesternTile = await loadSourceSelection(
    '[data-raster-source-tile="west"]',
    'west',
    0
  );
  assert.equal(
    revisitedWesternTile.sourceReadCount,
    easternTile.sourceReadCount,
    'revisiting a resident tile does not invoke its source decoder again'
  );
  assert.equal(
    revisitedWesternTile.cacheHits,
    easternTile.cacheHits + 1,
    'revisiting a resident tile increments the real cache hit counter'
  );
  assert.equal(
    revisitedWesternTile.graphCompileCount,
    easternTile.graphCompileCount,
    'a resident western revisit reuses its existing compatible compiled graph'
  );
  assert.equal(
    revisitedWesternTile.graphReuseCount,
    easternTile.graphReuseCount + 1,
    'a resident western revisit records one more genuine graph reuse'
  );
  assert.deepEqual(
    revisitedWesternTile.bins,
    westernTile.bins,
    'rebinding the cached western source reproduces its exact scientific histogram'
  );

  const revisitedEasternTile = await loadSourceSelection(
    '[data-raster-source-tile="east"]',
    'east',
    0
  );
  assert.equal(
    revisitedEasternTile.sourceReadCount,
    revisitedWesternTile.sourceReadCount,
    'revisiting the resident eastern tile also avoids a second source read'
  );
  assert.equal(
    revisitedEasternTile.cacheHits,
    revisitedWesternTile.cacheHits + 1,
    'the second resident revisit remains an actual tile cache hit'
  );
  assert.deepEqual(
    revisitedEasternTile.bins,
    easternTile.bins,
    'replacing compiled-graph imports restores the exact eastern histogram'
  );

  const easternOverview = await loadSourceSelection(
    '[data-raster-source-overview="1"]',
    'east',
    1
  );
  assert.equal(easternOverview.width, 80, 'the source-provided overview halves tile width');
  assert.equal(easternOverview.height, 112, 'the source-provided overview halves tile height');
  assert.equal(easternOverview.pixelCount, 80 * 112);
  assert.equal(
    easternOverview.sourceReadCount,
    revisitedEasternTile.sourceReadCount + 1,
    'the source-provided overview is decoded exactly once on its first visit'
  );
  assert.equal(
    easternOverview.graphCompileCount,
    revisitedEasternTile.graphCompileCount + 1,
    'different dimensions and overview level require a separate compiled graph'
  );
  assert.equal(
    easternOverview.residentTileCount,
    easternOverview.cacheCapacity,
    'the new overview stays within the configured resident tile count'
  );
  assert.equal(
    easternOverview.cacheEvictions,
    revisitedEasternTile.cacheEvictions + 1,
    'the first additional overview deterministically evicts the oldest unpinned tile'
  );
  assert.deepEqual(
    easternOverview.tileOrigin,
    [160, 0],
    'overview coordinates retain their exact native-resolution origin'
  );
  assert.notDeepEqual(
    easternOverview.bins,
    easternTile.bins,
    'source-provided overview samples recompute their actual GPU histogram'
  );
  assert(easternOverview.contourSegmentCount > 0, 'overview analysis retains GPU binary contours');
  assert(
    (await page.locator('[data-raster-source-description]').textContent()).includes('L1'),
    'the interface distinguishes the source-provided overview level'
  );

  const cacheCapacityControl = page.locator('[data-raster-control="cache-capacity"]');
  await cacheCapacityControl.scrollIntoViewIfNeeded();
  await cacheCapacityControl.fill('1');
  await page.waitForFunction(
    () => window.__luRasterLab.cacheCapacity === 1 && window.__luRasterLab.residentTileCount === 1,
    undefined,
    {timeout: timeoutMilliseconds}
  );
  const minimumResidency = await page.evaluate(() => ({
    capacity: window.__luRasterLab.cacheCapacity,
    residentTiles: window.__luRasterLab.residentTileCount,
    residentCpuBytes: window.__luRasterLab.residentCpuBytes,
    residentGpuBytes: window.__luRasterLab.residentGpuBytes,
    maximumCpuBytes: window.__luRasterLab.maximumCpuBytes,
    maximumGpuBytes: window.__luRasterLab.maximumGpuBytes,
    cacheEvictions: window.__luRasterLab.cacheEvictions,
    sourceReadCount: window.__luRasterLab.sourceReadCount,
    graphCompileCount: window.__luRasterLab.graphCompileCount,
    graphReuseCount: window.__luRasterLab.graphReuseCount
  }));
  assert.equal(minimumResidency.capacity, 1, 'the capacity control applies its true minimum budget');
  assert.equal(minimumResidency.residentTiles, 1, 'shrinking capacity evicts every inactive tile');
  assert(
    minimumResidency.cacheEvictions >= easternOverview.cacheEvictions + 2,
    'shrinking the tile budget evicts both older unpinned source windows'
  );
  assert.equal(
    minimumResidency.sourceReadCount,
    easternOverview.sourceReadCount,
    'changing an explicit capacity does not decode a new source tile'
  );
  assert(
    minimumResidency.residentCpuBytes <= minimumResidency.maximumCpuBytes &&
      minimumResidency.residentGpuBytes <= minimumResidency.maximumGpuBytes,
    'shrinking tile capacity preserves both byte-budget invariants'
  );
  assert(
    (await page.locator('[data-raster-cache-capacity]').textContent()).includes('1 / 1'),
    'the interface reflects the actual reduced resident-tile capacity'
  );

  const minimumCapacityWesternOverview = await loadSourceSelection(
    '[data-raster-source-tile="west"]',
    'west',
    1
  );
  assert.equal(
    minimumCapacityWesternOverview.residentTileCount,
    1,
    'a capacity-one source replacement never retains a second resident tile'
  );
  assert.equal(
    minimumCapacityWesternOverview.sourceReadCount,
    minimumResidency.sourceReadCount + 1,
    'the uncached western overview performs one source read after safe lease release'
  );
  assert.equal(
    minimumCapacityWesternOverview.graphCompileCount,
    minimumResidency.graphCompileCount,
    'capacity-one western and eastern overviews still share their compatible graph'
  );
  assert.equal(
    minimumCapacityWesternOverview.graphReuseCount,
    minimumResidency.graphReuseCount + 1,
    'capacity-one source replacement continues using per-encoding graph imports'
  );

  const minimumCapacityEasternOverview = await loadSourceSelection(
    '[data-raster-source-tile="east"]',
    'east',
    1
  );
  assert.equal(minimumCapacityEasternOverview.residentTileCount, 1);
  assert.equal(
    minimumCapacityEasternOverview.sourceReadCount,
    minimumCapacityWesternOverview.sourceReadCount + 1,
    'revisiting an evicted capacity-one tile performs a new real source decode'
  );
  assert.equal(
    minimumCapacityEasternOverview.cacheMisses,
    minimumCapacityWesternOverview.cacheMisses + 1,
    'revisiting an evicted tile increments the actual cache miss counter'
  );
  assert.equal(
    minimumCapacityEasternOverview.cacheEvictions,
    minimumCapacityWesternOverview.cacheEvictions + 1,
    'each capacity-one source replacement evicts exactly one previous tile'
  );
  assert.equal(
    minimumCapacityEasternOverview.graphCompileCount,
    minimumCapacityWesternOverview.graphCompileCount,
    'evicting source imports does not invalidate the compatible compiled graph'
  );
  assert.deepEqual(
    minimumCapacityEasternOverview.bins,
    easternOverview.bins,
    'a decoded replacement and rebound graph reproduce the original overview histogram'
  );

  await cacheCapacityControl.fill('3');
  await page.waitForFunction(
    () => window.__luRasterLab.cacheCapacity === 3,
    undefined,
    {timeout: timeoutMilliseconds}
  );

  const previousRequests = await page.evaluate(() => ({
    loadCount: window.__luRasterLab.tileLoadCount,
    abortedCount: window.__luRasterLab.abortedTileRequestCount,
    executionCount: window.__luRasterLab.executionCount
  }));
  await page.evaluate(() => {
    window.__luRasterLab.setSourceTile('west');
    window.__luRasterLab.setSourceTile('east');
    window.__luRasterLab.setSourceOverview(0);
    window.__luRasterLab.setSourceOverview(1);
    window.__luRasterLab.setEpsilon(0.0002);
  });
  await page.waitForFunction(
    ({loadCount, abortedCount, executionCount}) =>
      !window.__luRasterLab.sourceLoading &&
      window.__luRasterLab.tileLoadCount > loadCount &&
      window.__luRasterLab.abortedTileRequestCount > abortedCount &&
      window.__luRasterLab.executionCount > executionCount &&
      window.__luRasterLab.sourceTile === 'east' &&
      window.__luRasterLab.overviewLevel === 1 &&
      Math.abs(window.__luRasterLab.epsilon - 0.0002) < 0.0000001,
    previousRequests,
    {timeout: timeoutMilliseconds}
  );
  assert(
    (await page.evaluate(() => window.__luRasterLab.abortedTileRequestCount)) >=
      previousRequests.abortedCount + 2,
    'rapid selection changes abort superseded decoded tile requests'
  );
  assert.equal(
    await page.evaluate(() => window.__luRasterLab.coordinateReferenceSystem),
    'EPSG:32610',
    'cancellation never replaces the final selected tile with stale spatial metadata'
  );
  assert(
    await page.evaluate(() => window.__luRasterLab.contourSegmentCount > 0),
    'the final selected overview preserves the complete morphology and contour pipeline'
  );
  assert.equal(
    await page.evaluate(() =>
      window.__luRasterLab.bins.reduce((total, count) => total + count, 0)
    ),
    await page.evaluate(() => window.__luRasterLab.validPixelCount),
    'canceled requests cannot corrupt the surviving overview aggregate'
  );

  await loadSourceSelection('[data-raster-source-overview="0"]', 'east', 0);
  await loadSourceSelection('[data-raster-source-tile="full"]', 'full', 0);
  const previousMonolithicExecution = await page.evaluate(() => window.__luRasterLab.executionCount);
  await page.evaluate(() => {
    const rasterLab = window.__luRasterLab;
    rasterLab.setMorphologyMode('grayscale');
    rasterLab.setAutomaticThreshold(false);
    rasterLab.setThreshold(0.35, false);
    rasterLab.setMorphologyOperation('open');
    rasterLab.setMorphologyRadius(2);
    rasterLab.setMorphologyShape('square');
    rasterLab.setMorphologyNoDataPolicy('ignore');
    rasterLab.setMorphologyBorderMode('reflect');
    rasterLab.setSmoothingMode('gaussian');
    rasterLab.setSmoothingRadius(2);
    rasterLab.setEdgeMode('sobel');
    rasterLab.setEdgeDirection('magnitude');
  });
  await page.waitForFunction(
    previousExecution => {
      const rasterLab = window.__luRasterLab;
      return (
        !rasterLab.sourceLoading &&
        rasterLab.executionCount > previousExecution &&
        rasterLab.sourceTile === 'full' &&
        rasterLab.overviewLevel === 0 &&
        rasterLab.smoothingMode === 'gaussian' &&
        rasterLab.smoothingRadius === 2 &&
        rasterLab.edgeMode === 'sobel' &&
        rasterLab.morphologyOperation === 'open' &&
        rasterLab.morphologyMode === 'grayscale' &&
        !rasterLab.thresholdEnabled &&
        rasterLab.validPixelCount > rasterLab.pixelCount * 0.8
      );
    },
    previousMonolithicExecution,
    {timeout: timeoutMilliseconds}
  );

  const readHaloState = async () =>
    await page.evaluate(() => {
      const rasterLab = window.__luRasterLab;
      return {
        width: rasterLab.width,
        height: rasterLab.height,
        pixelCount: rasterLab.pixelCount,
        validPixelCount: rasterLab.validPixelCount,
        sum: rasterLab.sum,
        nodeCount: rasterLab.nodeCount,
        sourceTile: rasterLab.sourceTile,
        overviewLevel: rasterLab.overviewLevel,
        tileLoadCount: rasterLab.tileLoadCount,
        executionCount: rasterLab.executionCount,
        frameCount: rasterLab.frameCount,
        cacheCapacity: rasterLab.cacheCapacity,
        residentTileCount: rasterLab.residentTileCount,
        pinnedTileCount: rasterLab.pinnedTileCount,
        residentCpuBytes: rasterLab.residentCpuBytes,
        residentGpuBytes: rasterLab.residentGpuBytes,
        maximumCpuBytes: rasterLab.maximumCpuBytes,
        maximumGpuBytes: rasterLab.maximumGpuBytes,
        haloEnabled: rasterLab.haloEnabled,
        haloRadius: rasterLab.haloRadius,
        haloLevelZeroRadius: rasterLab.haloLevelZeroRadius,
        haloCoreBounds: rasterLab.haloCoreBounds,
        haloAvailableBounds: rasterLab.haloAvailableBounds,
        haloSourceTileCount: rasterLab.haloSourceTileCount,
        haloTransferCount: rasterLab.haloTransferCount,
        bins: rasterLab.bins
      };
    });

  const nativeMonolithic = await readHaloState();
  const independentWestern = await loadSourceSelection(
    '[data-raster-source-tile="west"]',
    'west',
    0
  );
  const seamlessButton = page.locator('[data-raster-halo-mode="seamless"]');
  await seamlessButton.scrollIntoViewIfNeeded();
  await seamlessButton.click();
  await page.waitForFunction(
    previousLoadCount => {
      const rasterLab = window.__luRasterLab;
      return (
        rasterLab.haloEnabled &&
        !rasterLab.sourceLoading &&
        rasterLab.tileLoadCount > previousLoadCount &&
        rasterLab.haloRadius === 7 &&
        rasterLab.haloSourceTileCount === 2 &&
        rasterLab.sourceTile === 'west'
      );
    },
    independentWestern.tileLoadCount,
    {timeout: timeoutMilliseconds}
  );

  const seamlessWestern = await readHaloState();
  assert.deepEqual(
    seamlessWestern.haloCoreBounds,
    [0, 0, 160, 224],
    'the western tile owns only its half-open native core'
  );
  assert.deepEqual(
    seamlessWestern.haloAvailableBounds,
    [0, 0, 167, 224],
    'the composed halo clips only at the real western dataset boundary'
  );
  assert.deepEqual(
    seamlessWestern.haloLevelZeroRadius,
    [7, 7],
    'Gaussian radius two, Sobel radius one, and two opening stages sum to seven source pixels'
  );
  assert.equal(
    seamlessWestern.haloTransferCount,
    5,
    'two resident neighbors contribute both native bands before one owned-core extraction'
  );
  assert.equal(seamlessWestern.pixelCount, 160 * 224, 'assembled halo pixels are never published');
  assert(
    seamlessWestern.pinnedTileCount >= 2,
    'the displayed graph keeps both borrowed native source tiles pinned'
  );
  assert(
    seamlessWestern.nodeCount >= independentWestern.nodeCount + seamlessWestern.haloTransferCount,
    'halo assembly and core extraction are actual declared GPU command-graph work'
  );
  assert(
    Math.abs(seamlessWestern.sum - independentWestern.sum) > 0.00001 ||
      seamlessWestern.validPixelCount !== independentWestern.validPixelCount,
    'borrowing the adjacent seam changes the independently bordered tile result'
  );
  assert(
    (await page.locator('[data-raster-halo-radius]').textContent()).includes('7 px'),
    'the dashboard publishes the cumulative pipeline receptive field'
  );
  assert(
    (await page.locator('[data-raster-halo-core]').textContent()).includes('[0, 160)'),
    'the dashboard exposes explicit half-open output ownership'
  );
  assert(
    (await page.locator('[data-raster-map-scale]').textContent()).includes('2 tiles · 7 px halo'),
    'the rendered map accurately identifies neighboring resident inputs'
  );

  const seamlessEastern = await loadSourceSelection(
    '[data-raster-source-tile="east"]',
    'east',
    0
  );
  assert.deepEqual(seamlessEastern.haloCoreBounds, [160, 0, 320, 224]);
  assert.deepEqual(
    seamlessEastern.haloAvailableBounds,
    [153, 0, 320, 224],
    'the eastern halo borrows real western samples and clips only at the true outer edge'
  );
  assert.equal(
    seamlessWestern.validPixelCount + seamlessEastern.validPixelCount,
    nativeMonolithic.validPixelCount,
    'half-open native cores reproduce every monolithic valid pixel exactly once'
  );
  assert(
    Math.abs(seamlessWestern.sum + seamlessEastern.sum - nativeMonolithic.sum) < 0.05,
    'GPU-only Gaussian, Sobel, and opening values match the full native raster across its seam'
  );
  assert(
    seamlessEastern.residentCpuBytes <= seamlessEastern.maximumCpuBytes &&
      seamlessEastern.residentGpuBytes <= seamlessEastern.maximumGpuBytes,
    'resident neighbors and graph-owned padded scratch remain within explicit byte budgets'
  );

  await loadSourceSelection('[data-raster-source-tile="full"]', 'full', 0);
  const monolithicOverview = await loadSourceSelection(
    '[data-raster-source-overview="1"]',
    'full',
    1
  );
  assert.deepEqual(
    monolithicOverview.haloLevelZeroRadius,
    [14, 14],
    'a source-provided overview scales the composed halo to level-zero coordinates'
  );
  const seamlessWesternOverview = await loadSourceSelection(
    '[data-raster-source-tile="west"]',
    'west',
    1
  );
  const seamlessEasternOverview = await loadSourceSelection(
    '[data-raster-source-tile="east"]',
    'east',
    1
  );
  assert.deepEqual(seamlessWesternOverview.haloCoreBounds, [0, 0, 80, 112]);
  assert.deepEqual(seamlessWesternOverview.haloAvailableBounds, [0, 0, 87, 112]);
  assert.deepEqual(seamlessEasternOverview.haloCoreBounds, [80, 0, 160, 112]);
  assert.deepEqual(seamlessEasternOverview.haloAvailableBounds, [73, 0, 160, 112]);
  assert.deepEqual(seamlessEasternOverview.haloLevelZeroRadius, [14, 14]);
  assert.equal(
    seamlessWesternOverview.validPixelCount + seamlessEasternOverview.validPixelCount,
    monolithicOverview.validPixelCount,
    'disjoint overview cores reproduce all valid monolithic overview samples'
  );
  assert(
    Math.abs(
      seamlessWesternOverview.sum + seamlessEasternOverview.sum - monolithicOverview.sum
    ) < 0.05,
    'scaled overview halos preserve the same composed GPU seam parity'
  );

  await cacheCapacityControl.fill('1');
  await page.waitForFunction(
    () =>
      window.__luRasterLab.cacheCapacity === 3 &&
      document.querySelector('[data-raster-control="cache-capacity"]').value === '3',
    undefined,
    {timeout: timeoutMilliseconds}
  );
  assert(
    (await page.evaluate(() => window.__luRasterLab.pinnedTileCount)) >= 2,
    'a rejected capacity-one shrink cannot evict either live cross-tile GPU source'
  );

  await cacheCapacityControl.fill('2');
  await page.waitForFunction(
    () => window.__luRasterLab.cacheCapacity === 2 && window.__luRasterLab.residentTileCount <= 2,
    undefined,
    {timeout: timeoutMilliseconds}
  );
  const capacityTwoFullOverview = await loadSourceSelection(
    '[data-raster-source-tile="full"]',
    'full',
    1
  );
  assert.equal(
    capacityTwoFullOverview.haloSourceTileCount,
    1,
    'a capacity-two handoff fences both former overview neighbors before loading a full overview'
  );
  const capacityTwoWesternOverview = await loadSourceSelection(
    '[data-raster-source-tile="west"]',
    'west',
    1
  );
  assert.equal(
    capacityTwoWesternOverview.haloSourceTileCount,
    2,
    'the full overview is fenced before both capacity-two neighbor tiles are acquired'
  );
  assert.equal(
    capacityTwoWesternOverview.pinnedTileCount,
    2,
    'both cross-tile source buffers remain pinned after the bounded neighborhood replacement'
  );
  const capacityTwoNativeWest = await loadSourceSelection(
    '[data-raster-source-overview="0"]',
    'west',
    0
  );
  assert.equal(
    capacityTwoNativeWest.haloSourceTileCount,
    2,
    'changing overview levels fence-releases both obsolete neighbors before admitting new ones'
  );
  assert.deepEqual(capacityTwoNativeWest.haloAvailableBounds, [0, 0, 167, 224]);
  assert(
    capacityTwoNativeWest.residentCpuBytes <= capacityTwoNativeWest.maximumCpuBytes &&
      capacityTwoNativeWest.residentGpuBytes <= capacityTwoNativeWest.maximumGpuBytes,
    'capacity-two source handoffs retain explicit CPU/GPU residency guarantees'
  );

  await page.waitForFunction(
    previousFrameCount => window.__luRasterLab.frameCount > previousFrameCount,
    composedSmoothing.frameCount,
    {timeout: timeoutMilliseconds}
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
      `(${initialState.validPixelCount.toLocaleString()}/${initialState.pixelCount.toLocaleString()} valid pixels, ${initialState.nodeCount} GPU graph nodes, bounded cache, cumulative halos, and native/overview seam parity verified)\n`
  );
} finally {
  await browser?.close();
  await server.close();
}
