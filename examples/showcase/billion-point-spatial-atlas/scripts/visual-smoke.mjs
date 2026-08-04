// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {createServer} from 'vite';
import {
  getPlaywrightLaunchOptions
} from '../../../../scripts/playwright/get-playwright-launch-options.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotPath =
  process.env.SPATIAL_ATLAS_SCREENSHOT ?? join(tmpdir(), 'billion-point-spatial-atlas.png');
const layoutScreenshotPath = screenshotPath.endsWith('.png')
  ? `${screenshotPath.slice(0, -4)}-layout.png`
  : `${screenshotPath}-layout.png`;
const requireGPUReadback = process.env.SPATIAL_ATLAS_REQUIRE_GPU_READBACK === 'true';
const timeoutMilliseconds = 60_000;
const viewport = {width: 1440, height: 900};
const server = await createServer({
  root,
  logLevel: 'error',
  server: {host: '127.0.0.1', port: 0, strictPort: false}
});
let browser;
let artifactBrowser;
let page;
let sceneArtifactWritten = false;

try {
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  assert(url, 'Vite did not publish a local URL');

  browser = await chromium.launch(
    getPlaywrightLaunchOptions({headless: true, softwareGpu: true})
  );
  const browserContext = await browser.newContext({viewport});
  page = await browserContext.newPage();
  artifactBrowser = await chromium.launch({headless: true, args: ['--disable-gpu']});
  page.setDefaultTimeout(timeoutMilliseconds);

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const smokeUrl = new URL(url);
  smokeUrl.searchParams.set('visual-smoke', 'true');
  await page.goto(smokeUrl.toString(), {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('canvas');
      return (
        canvas instanceof HTMLCanvasElement &&
        canvas.width > 10 &&
        canvas.height > 10 &&
        canvas.dataset.atlasRenderedMode === 'taxi' &&
        Boolean(document.querySelector('[data-atlas-navigation]')) &&
        Boolean(document.querySelector('#example-panel-host [data-mode]'))
      );
    },
    undefined,
    {timeout: timeoutMilliseconds}
  );
  await pauseAtlasAnimation(page);
  logPhase('initial Atlas state initialized');

  const initialState = await readAtlasState(page);
  const initialLayoutArtifact = await captureLayoutArtifact(page, artifactBrowser);
  await writeFile(layoutScreenshotPath, initialLayoutArtifact);
  const initialRenderedFrame = requireGPUReadback ? await captureRenderedFrame(page) : null;
  const initialRenderedFramePng = initialRenderedFrame
    ? decodeDataUrl(initialRenderedFrame.pngDataUrl)
    : initialLayoutArtifact;
  await writeFile(screenshotPath, initialRenderedFramePng);
  sceneArtifactWritten = Boolean(initialRenderedFrame);
  if (initialRenderedFrame) assertRenderedFrame(initialRenderedFrame, 'taxi', 'initial taxi view');
  assert(initialState.hasWebGPU, 'Playwright Chromium did not expose WebGPU');
  assert.equal(initialState.canvasCount, 1, 'atlas renders exactly one canvas');
  assert(initialState.hasNavigationToolbar, 'atlas exposes its navigation toolbar over the canvas');
  assert(initialState.hasQueryFootprint, 'atlas exposes a persistent spatial-query footprint');
  assert(initialState.hasHoverTooltip, 'atlas exposes its GPU-picked point tooltip');
  assert.equal(initialState.navigationButtonCount, 5, 'atlas exposes tool, zoom, and fit controls');
  assert.equal(
    initialState.navigationDropdownTriggerCount,
    3,
    'atlas exposes three compact canvas dropdowns'
  );
  assert.equal(
    initialState.navigationDropdownVisibleCount,
    3,
    'all compact canvas dropdowns are visible and actionable'
  );
  assert.equal(initialState.renderedMode, 'taxi', 'the render loop completed a taxi frame');
  assert(initialState.renderFrame > 0, 'the taxi render loop publishes a positive frame index');
  assert.equal(initialState.maximumViewScale, '32', 'atlas exposes detailed taxi-zone zoom');
  assert.equal(initialState.mode, 'taxi', 'atlas starts in taxi mode');
  assert.equal(initialState.queryKind, 'polygon', 'taxi mode starts with a polygon query');
  assert.equal(initialState.execution, 'index', 'taxi mode starts on the uniform-grid index');
  assert.equal(initialState.zone, '230', 'taxi mode starts at Times Square');
  assert.match(initialState.title, /Billion-Point Spatial Atlas/);
  await assertBoundedLayout(page, 'initial taxi view');
  assert.notEqual(initialState.gpuResidentCount, '0', 'taxi mode has GPU-resident points');
  assert.notEqual(initialState.candidateCount, '0', 'taxi mode generates GPU query candidates');
  assert(
    initialRenderedFramePng.byteLength > 1_000,
    'initial taxi scene artifact was unexpectedly empty'
  );

  await changeCompactDropdown(page, '[data-atlas-navigation]', 'TLC taxi zone', 'Astoria · Queens');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-atlas-overlay-zone]')?.value === '7' &&
      document.querySelector('[data-atlas-navigation-hint]')?.textContent?.includes('Astoria')
  );
  const astoriaState = await readAtlasState(page);
  assert.equal(astoriaState.zone, '7', 'the taxi-zone control selects Astoria');
  assert.equal(astoriaState.panelZone, '7', 'the panel and canvas taxi-zone controls stay in sync');
  assert.notEqual(
    astoriaState.queryFootprintPath,
    initialState.queryFootprintPath,
    'changing taxi zone updates the query footprint'
  );
  assert(
    astoriaState.viewScale > initialState.viewScale,
    'selecting a taxi zone fits the camera to its outline'
  );

  await changeSelect(page, '[data-atlas-overlay-query-kind]', 'radius');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () => document.querySelector('[data-atlas-overlay-query-kind]')?.value === 'radius'
  );
  const radiusState = await readAtlasState(page);
  assert.equal(radiusState.queryKind, 'radius', 'the canvas control selects a radius query');
  assert.equal(
    radiusState.panelQueryKind,
    'radius',
    'the panel and canvas query controls stay in sync'
  );
  assert.match(radiusState.queryFootprintPath, /A/, 'the query footprint changes to a radius');

  await changeSelect(page, '[data-atlas-overlay-execution]', 'scan');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () => document.querySelector('[data-atlas-overlay-execution]')?.value === 'scan'
  );
  const scanState = await readAtlasState(page);
  assert.equal(scanState.execution, 'scan', 'the execution control selects the full-scan path');
  assert.equal(
    scanState.panelExecution,
    'scan',
    'the panel and canvas execution controls stay in sync'
  );

  const scaleBeforeZoom = scanState.viewScale;
  await clickControl(page, '[data-atlas-action="zoom-in"]');
  await requestAtlasRedraw(page);
  await page.waitForFunction(previousScale => {
    const text = document.querySelector('[data-atlas-navigation-scale]')?.textContent ?? '';
    return Number.parseFloat(text) > previousScale;
  }, scaleBeforeZoom);
  const zoomedState = await readAtlasState(page);
  assert(zoomedState.viewScale > scaleBeforeZoom, 'zoom-in changes the camera scale');
  assert(zoomedState.viewScale <= 32, 'camera zoom remains within the advertised maximum');

  await clickControl(page, '[data-atlas-action="reset"]');
  await requestAtlasRedraw(page);
  await page.waitForFunction(zoomedScale => {
    const text = document.querySelector('[data-atlas-navigation-scale]')?.textContent ?? '';
    return Number.parseFloat(text) < zoomedScale;
  }, zoomedState.viewScale);
  const resetState = await readAtlasState(page);
  assert(resetState.viewScale < zoomedState.viewScale, 'fit resets a zoomed taxi camera');
  await assertBoundedLayout(page, 'modified taxi view');
  logPhase('taxi interactions verified');

  await changeSelect(page, '#example-panel-host [data-mode]', 'lidar');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () =>
      document.querySelector('#example-panel-host [data-mode]')?.value === 'lidar' &&
      document
        .querySelector('[data-atlas-navigation-context]')
        ?.textContent?.includes('NYC LIDAR') &&
      document.querySelector('canvas')?.dataset.atlasRenderedMode === 'lidar'
  );
  logPhase('LiDAR mode initialized');
  const lidarState = await readAtlasState(page);
  assert.equal(lidarState.mode, 'lidar', 'the Atlas control switches to LiDAR mode');
  assert.equal(lidarState.renderedMode, 'lidar', 'the render loop completed a LiDAR frame');
  assert(lidarState.renderFrame > 0, 'the LiDAR render loop publishes a positive frame index');
  assert.equal(lidarState.queryKind, 'bounds', 'LiDAR mode starts with a bounds query');
  assert.equal(lidarState.execution, 'scan', 'execution selection survives the mode switch');
  assert.equal(lidarState.queryFootprintDisplay, 'none', 'taxi footprint is hidden in LiDAR mode');
  assert(lidarState.zoneRowHidden, 'taxi-zone controls are hidden in LiDAR mode');
  assert.match(
    lidarState.loadLidarButtonText,
    /Stream live USGS EPT\/LAZ/,
    'LiDAR mode begins with its deterministic synthetic fixture'
  );

  await changeSelect(page, '#example-panel-host [data-color-mode]', 'intensity');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () => document.querySelector('#example-panel-host [data-color-mode]')?.value === 'intensity'
  );
  logPhase('LiDAR intensity control verified');
  assert.equal(
    (await readAtlasState(page)).colorMode,
    'intensity',
    'synthetic LiDAR controls remain interactive'
  );
  const renderedLidarState = await readAtlasState(page);
  assert.notEqual(renderedLidarState.gpuResidentCount, '0', 'LiDAR mode has GPU-resident points');
  assert.notEqual(
    renderedLidarState.candidateCount,
    '0',
    'LiDAR mode generates GPU query candidates'
  );
  const lidarLayoutArtifact = await captureLayoutArtifact(page, artifactBrowser);
  await writeFile(layoutScreenshotPath, lidarLayoutArtifact);
  const lidarRenderedFrame = requireGPUReadback ? await captureRenderedFrame(page) : null;
  const lidarRenderedFramePng = lidarRenderedFrame
    ? decodeDataUrl(lidarRenderedFrame.pngDataUrl)
    : lidarLayoutArtifact;
  await writeFile(screenshotPath, lidarRenderedFramePng);
  sceneArtifactWritten ||= Boolean(lidarRenderedFrame);
  if (lidarRenderedFrame) assertRenderedFrame(lidarRenderedFrame, 'lidar', 'synthetic LiDAR view');
  logPhase('LiDAR visual artifact captured');
  assert(
    lidarRenderedFramePng.byteLength > 1_000,
    'synthetic LiDAR scene artifact was unexpectedly empty'
  );
  if (initialRenderedFrame && lidarRenderedFrame) {
    assert.notEqual(
      initialRenderedFrame.hash,
      lidarRenderedFrame.hash,
      'LiDAR scene differs from taxi'
    );
  }
  await assertBoundedLayout(page, 'synthetic LiDAR view');
  logPhase('synthetic LiDAR state and layout verified');

  await changeSelect(page, '#example-panel-host [data-mode]', 'taxi');
  await requestAtlasRedraw(page);
  await page.waitForFunction(
    () =>
      document.querySelector('#example-panel-host [data-mode]')?.value === 'taxi' &&
      document
        .querySelector('[data-atlas-navigation-context]')
        ?.textContent?.includes('NYC TAXI') &&
      document.querySelector('canvas')?.dataset.atlasRenderedMode === 'taxi'
  );
  const restoredTaxiState = await readAtlasState(page);
  assert.equal(restoredTaxiState.mode, 'taxi', 'the Atlas control returns to taxi mode');
  assert.equal(restoredTaxiState.queryKind, 'polygon', 'returning to taxi restores polygon query');
  assert.equal(restoredTaxiState.zone, '7', 'returning to taxi preserves the selected zone');
  assert.equal(restoredTaxiState.execution, 'scan', 'returning to taxi preserves execution choice');
  assert.notEqual(
    restoredTaxiState.queryFootprintDisplay,
    'none',
    'returning to taxi restores its query footprint'
  );
  assert(!restoredTaxiState.zoneRowHidden, 'returning to taxi restores taxi-zone controls');
  await assertBoundedLayout(page, 'restored taxi view');

  const restoredTaxiLayoutArtifact = await captureLayoutArtifact(page, artifactBrowser);
  await writeFile(layoutScreenshotPath, restoredTaxiLayoutArtifact);
  const restoredTaxiRenderedFrame = requireGPUReadback ? await captureRenderedFrame(page) : null;
  if (restoredTaxiRenderedFrame) {
    await writeFile(screenshotPath, decodeDataUrl(restoredTaxiRenderedFrame.pngDataUrl));
    sceneArtifactWritten = true;
    assertRenderedFrame(restoredTaxiRenderedFrame, 'taxi', 'restored taxi view');
  } else {
    await writeFile(screenshotPath, restoredTaxiLayoutArtifact);
  }
  assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('\n')}`);
  assert(
    (await stat(screenshotPath)).size > 1_000,
    'visual smoke scene artifact was unexpectedly empty'
  );
  assert(
    (await stat(layoutScreenshotPath)).size > 10_000,
    'layout artifact was unexpectedly empty'
  );

  process.stdout.write(
    `Spatial Atlas visual smoke passed: ${screenshotPath} ` +
      '(taxi zone/query/execution, zoom, synthetic LiDAR, and layout)\n'
  );
} catch (error) {
  if (page && artifactBrowser) {
    try {
      const failureLayoutArtifact = await captureLayoutArtifact(page, artifactBrowser);
      await writeFile(layoutScreenshotPath, failureLayoutArtifact);
      if (!sceneArtifactWritten) await writeFile(screenshotPath, failureLayoutArtifact);
    } catch {
      // Preserve the original smoke failure when even the layout artifact cannot be captured.
    }
  }
  throw error;
} finally {
  await artifactBrowser?.close();
  await browser?.close();
  await server.close();
}

async function changeCompactDropdown(page, scopeSelector, ariaLabel, optionLabel) {
  const opened = await page.evaluate(
    ({scopeSelector, ariaLabel}) => {
      const triggers = document.querySelectorAll(
        `${scopeSelector} [data-compact-dropdown-trigger][aria-label="${ariaLabel}"]`
      );
      if (triggers.length !== 1 || !(triggers[0] instanceof HTMLButtonElement)) {
        throw new Error(`Expected one visible ${ariaLabel} compact dropdown`);
      }
      triggers[0].click();
      return {
        expanded: triggers[0].getAttribute('aria-expanded'),
        listboxIdentifier: triggers[0].getAttribute('aria-controls')
      };
    },
    {scopeSelector, ariaLabel}
  );
  assert.equal(opened.expanded, 'true', `${ariaLabel} dropdown opens`);
  const listboxIdentifier = opened.listboxIdentifier;
  assert(listboxIdentifier, `${ariaLabel} dropdown identifies its listbox`);
  const selected = await page.evaluate(
    ({listboxIdentifier, optionLabel, scopeSelector, ariaLabel}) => {
      const options = Array.from(
        document.querySelectorAll(`#${listboxIdentifier} [data-compact-dropdown-option]`)
      ).filter(option => option.textContent?.trim() === optionLabel);
      if (options.length !== 1 || !(options[0] instanceof HTMLElement)) {
        throw new Error(`${ariaLabel} does not contain ${optionLabel}`);
      }
      options[0].click();
      return document
        .querySelector(
          `${scopeSelector} [data-compact-dropdown-trigger][aria-label="${ariaLabel}"]`
        )
        ?.getAttribute('aria-expanded');
    },
    {listboxIdentifier, optionLabel, scopeSelector, ariaLabel}
  );
  assert.equal(selected, 'false', `${ariaLabel} dropdown closes`);
}

async function changeSelect(page, selector, value) {
  await page.evaluate(
    ({selector, value}) => {
      const select = document.querySelector(selector);
      if (!(select instanceof HTMLSelectElement)) {
        throw new Error(`Missing select: ${selector}`);
      }
      if (!Array.from(select.options).some(option => option.value === value)) {
        throw new Error(`Missing ${value} option in ${selector}`);
      }
      select.value = value;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    },
    {selector, value}
  );
}

async function clickControl(page, selector) {
  await page.evaluate(selector => {
    const button = document.querySelector(selector);
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Missing button: ${selector}`);
    }
    button.click();
  }, selector);
}

async function requestAtlasRedraw(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('spatial-atlas-redraw'));
  });
}

async function pauseAtlasAnimation(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('spatial-atlas-pause'));
  });
}

async function captureRenderedFrame(page) {
  return page.evaluate(async timeout => {
    if (typeof window.spatialAtlasCaptureFrame !== 'function') {
      throw new Error('Spatial Atlas rendered-frame capture is unavailable');
    }
    return Promise.race([
      window.spatialAtlasCaptureFrame(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Spatial Atlas GPU readback timed out')), timeout);
      })
    ]);
  }, 30_000);
}

function assertRenderedFrame(frame, expectedMode, label) {
  assert.equal(frame.mode, expectedMode, `${label}: scene readback matches the active mode`);
  assert(frame.width > 10 && frame.height > 10, `${label}: scene readback has dimensions`);
  assert(frame.uniquePixelCount > 1, `${label}: rendered scene is not a flat clear color`);
  assert(frame.foregroundPixelCount > 10, `${label}: rendered scene contains visible geometry`);
}

function decodeDataUrl(dataUrl) {
  const separatorIndex = dataUrl.indexOf(',');
  assert(separatorIndex >= 0, 'rendered scene is encoded as a data URL');
  return Buffer.from(dataUrl.slice(separatorIndex + 1), 'base64');
}

async function captureLayoutArtifact(page, artifactBrowser) {
  const snapshotHtml = await page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    for (const script of clone.querySelectorAll('script')) script.remove();
    const canvas = clone.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing Atlas canvas');
    const placeholder = document.createElement('div');
    placeholder.dataset.atlasCanvasPlaceholder = '';
    placeholder.setAttribute(
      'style',
      'position:fixed;inset:0;width:100vw;height:100vh;background:#020407'
    );
    canvas.replaceWith(placeholder);
    const base = document.createElement('base');
    base.href = document.baseURI;
    clone.querySelector('head')?.prepend(base);
    return `<!doctype html>${clone.outerHTML}`;
  });
  const artifactContext = await artifactBrowser.newContext({viewport});
  const artifactPage = await artifactContext.newPage();
  try {
    await artifactPage.setContent(snapshotHtml, {waitUntil: 'domcontentloaded'});
    return await artifactPage.screenshot({
      type: 'png',
      animations: 'disabled'
    });
  } finally {
    await artifactContext.close();
  }
}

function logPhase(message) {
  process.stdout.write(`Spatial Atlas smoke: ${message}\n`);
}

async function readAtlasState(page) {
  return page.evaluate(() => {
    const getSelectValue = selector => {
      const element = document.querySelector(selector);
      return element instanceof HTMLSelectElement ? element.value : null;
    };
    const viewScaleText =
      document.querySelector('[data-atlas-navigation-scale]')?.textContent ?? '';
    const canvas = document.querySelector('canvas');
    const queryFootprint = document.querySelector('[data-atlas-query-footprint]');
    const zoneRow = document.querySelector('[data-atlas-overlay-zone-row]');
    const navigationDropdownTriggers = Array.from(
      document.querySelectorAll('[data-atlas-navigation] [data-compact-dropdown-trigger]')
    );
    const navigationDropdownVisibleCount = navigationDropdownTriggers.filter(element => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        bounds.width > 0 &&
        bounds.height > 0
      );
    }).length;
    const statRows = document.querySelector('[data-atlas-stats] > div')?.children ?? [];
    const stats = {};
    for (let index = 0; index + 1 < statRows.length; index += 2) {
      const label = statRows[index]?.textContent?.trim();
      const value = statRows[index + 1]?.textContent?.trim();
      if (label && value) stats[label] = value;
    }
    return {
      hasWebGPU: Boolean(navigator.gpu),
      canvasCount: document.querySelectorAll('canvas').length,
      hasNavigationToolbar: Boolean(document.querySelector('[data-atlas-navigation]')),
      hasQueryFootprint: Boolean(queryFootprint),
      hasHoverTooltip: Boolean(document.querySelector('[data-atlas-hover-tooltip]')),
      navigationButtonCount: document.querySelectorAll('[data-atlas-action]').length,
      navigationDropdownTriggerCount: navigationDropdownTriggers.length,
      navigationDropdownVisibleCount,
      maximumViewScale: document.querySelector('[data-view-scale]')?.getAttribute('max'),
      renderedMode:
        canvas instanceof HTMLCanvasElement ? (canvas.dataset.atlasRenderedMode ?? null) : null,
      renderFrame:
        canvas instanceof HTMLCanvasElement
          ? Number.parseInt(canvas.dataset.atlasRenderFrame ?? '0', 10)
          : 0,
      mode: getSelectValue('#example-panel-host [data-mode]'),
      queryKind: getSelectValue('[data-atlas-overlay-query-kind]'),
      panelQueryKind: getSelectValue('#example-panel-host [data-query-kind]'),
      execution: getSelectValue('[data-atlas-overlay-execution]'),
      panelExecution: getSelectValue('#example-panel-host [data-execution]'),
      zone: getSelectValue('[data-atlas-overlay-zone]'),
      panelZone: getSelectValue('#example-panel-host [data-zone]'),
      colorMode: getSelectValue('#example-panel-host [data-color-mode]'),
      viewScale: Number.parseFloat(viewScaleText),
      queryFootprintDisplay: queryFootprint ? getComputedStyle(queryFootprint).display : null,
      queryFootprintPath:
        document.querySelector('[data-atlas-query-footprint] path')?.getAttribute('d') ?? '',
      zoneRowHidden:
        zoneRow instanceof HTMLElement
          ? zoneRow.hidden || getComputedStyle(zoneRow).display === 'none'
          : true,
      loadLidarButtonText:
        document.querySelector('#example-panel-host [data-load-lidar]')?.textContent?.trim() ?? '',
      gpuResidentCount: stats['GPU resident'] ?? '0',
      candidateCount: stats.candidate ?? '0',
      title: document.title
    };
  });
}

async function assertBoundedLayout(page, label) {
  const layout = await page.evaluate(() => {
    const getBounds = element => {
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      };
    };
    const isVisible = element => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return (
        !element.hidden &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        bounds.width > 0 &&
        bounds.height > 0
      );
    };
    const canvas = document.querySelector('canvas');
    const panel = document.querySelector('#atlas-panel-shell');
    const navigation = document.querySelector('[data-atlas-navigation]');
    const visibleControls = Array.from(
      document.querySelectorAll(
        '#atlas-panel-shell button, #atlas-panel-shell input, #atlas-panel-shell select, ' +
          '#atlas-panel-shell [data-compact-dropdown], [data-atlas-navigation] button, ' +
          '[data-atlas-navigation] select, [data-atlas-navigation] [data-compact-dropdown]'
      )
    ).filter(isVisible);
    const outOfViewportControls = visibleControls.flatMap((element, index) => {
      const bounds = getBounds(element);
      const bounded =
        bounds.left >= -1 &&
        bounds.top >= -1 &&
        bounds.right <= window.innerWidth + 1 &&
        bounds.bottom <= window.innerHeight + 1;
      return bounded ? [] : [{index, tagName: element.tagName, bounds}];
    });
    return {
      viewport: {width: window.innerWidth, height: window.innerHeight},
      canvas:
        canvas instanceof HTMLCanvasElement
          ? {
              width: canvas.width,
              height: canvas.height,
              clientWidth: canvas.clientWidth,
              clientHeight: canvas.clientHeight,
              bounds: getBounds(canvas)
            }
          : null,
      panel: panel instanceof HTMLElement ? getBounds(panel) : null,
      navigation: navigation instanceof HTMLElement ? getBounds(navigation) : null,
      outOfViewportControls,
      panelHorizontalOverflow:
        panel instanceof HTMLElement ? panel.scrollWidth - panel.clientWidth : Number.NaN,
      navigationHorizontalOverflow:
        navigation instanceof HTMLElement
          ? navigation.scrollWidth - navigation.clientWidth
          : Number.NaN
    };
  });

  assert.deepEqual(layout.viewport, viewport, `${label}: viewport stays deterministic`);
  assert(layout.canvas, `${label}: canvas exists`);
  assert(layout.canvas.width > 10 && layout.canvas.height > 10, `${label}: canvas has GPU pixels`);
  assert(
    layout.canvas.clientWidth === viewport.width && layout.canvas.clientHeight === viewport.height,
    `${label}: canvas fills the viewport`
  );
  for (const [name, bounds] of [
    ['canvas', layout.canvas.bounds],
    ['panel', layout.panel],
    ['navigation', layout.navigation]
  ]) {
    assert(bounds && bounds.width > 0 && bounds.height > 0, `${label}: ${name} is visible`);
    assert(bounds.left >= -1 && bounds.top >= -1, `${label}: ${name} starts inside the viewport`);
    assert(
      bounds.right <= viewport.width + 1 && bounds.bottom <= viewport.height + 1,
      `${label}: ${name} ends inside the viewport`
    );
  }
  assert.deepEqual(
    layout.outOfViewportControls,
    [],
    `${label}: visible controls stay inside the viewport`
  );
  assert(
    layout.panelHorizontalOverflow <= 1,
    `${label}: the controls panel does not overflow horizontally`
  );
  assert(
    layout.navigationHorizontalOverflow <= 1,
    `${label}: the canvas controls do not overflow horizontally`
  );
}
