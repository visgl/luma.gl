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
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const server = await createServer({root, logLevel: 'error', server: {host: '127.0.0.1', port: 0}});
await server.listen();
function differentPixels(first, second) {
  let count = 0;
  const scale = first.width / 1100;
  for (let vertical = 80 * scale; vertical < Math.min(first.height, second.height) - 20; vertical++) {
    for (let horizontal = 300 * scale; horizontal < Math.min(first.width, second.width) - 20; horizontal++) {
      const firstOffset = (vertical * first.width + horizontal) * 4;
      const secondOffset = (vertical * second.width + horizontal) * 4;
      if ([0, 1, 2].some(channel => Math.abs(first.data[firstOffset + channel] - second.data[secondOffset + channel]) > 3)) count++;
    }
  }
  return count;
}
try {
  for (const backend of ['webgpu', 'webgl']) {
    const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend, softwareGpu: true,
      launchOptions: process.platform === 'linux' && backend === 'webgpu'
        ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']} : {}}));
    try {
      const page = await browser.newPage({viewport: {width: 1100, height: 800}, deviceScaleFactor: backend === 'webgpu' ? 2 : 1});
      const errors = [];
      page.on('pageerror', error => {errors.push(error.message); console.error(error.message);});
      page.on('console', message => {if (message.type() === 'error') {errors.push(message.text()); console.error(message.text());}});
      await page.goto(`${process.env.STROKE_EXAMPLE_URL || server.resolvedUrls.local[0]}?backend=${backend}`);
      await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, {timeout: 60_000});
      await page.waitForTimeout(400);
      const dashed = PNG.sync.read(await page.screenshot({path: join(tmpdir(), `styled-paths-${backend}.png`)}));
      if (process.env.STROKE_THUMBNAIL && backend === 'webgpu') {
        await page.screenshot({path: process.env.STROKE_THUMBNAIL, type: 'jpeg', quality: 90});
      }
      await page.evaluate(() => {
        window.ownedVertices = window.strokeScene.deck.props.layers.find(layer => layer.id === 'routes').state.vertices;
        window.strokeScene.rebuildLayers();
      });
      await page.waitForTimeout(150);
      assert.equal(differentPixels(dashed, PNG.sync.read(await page.screenshot())), 0, `${backend}: stable phase on redraw`);
      await page.evaluate(() => window.strokeScene.setDash({offset: 25}));
      await page.waitForTimeout(150);
      assert(differentPixels(dashed, PNG.sync.read(await page.screenshot())) > 100, `${backend}: phase moves the dashes`);
      await page.uncheck('#enabled');
      await page.waitForTimeout(150);
      const solid = PNG.sync.read(await page.screenshot());
      assert(differentPixels(dashed, solid) > 100, `${backend}: dash toggle changes coverage`);
      assert.equal(await page.evaluate(() => window.ownedVertices === window.strokeScene.deck.props.layers.find(layer => layer.id === 'routes').state.vertices), true, `${backend}: dash uniforms reuse geometry`);
      await page.selectOption('#join', 'bevel');
      await page.selectOption('#cap', 'square');
      await page.locator('#width').focus();
      await page.keyboard.press('End');
      await page.waitForTimeout(150);
      assert(differentPixels(solid, PNG.sync.read(await page.screenshot())) > 100, `${backend}: geometry controls change stroke shape`);
      assert.equal(await page.evaluate(() => window.ownedVertices.destroyed), true, `${backend}: replaced geometry is released`);
      const picked = await page.evaluate(async () => {
        const scene = window.strokeScene;
        scene.setEnabled(true);
        scene.setDash({dashLength: 25, gapLength: 15, offset: 0});
        scene.setGeometryOptions({width: 14});
        scene.deck.setProps({initialViewState: {longitude: -74.006, latitude: 40.7128, zoom: 15.6, pitch: 0, bearing: 0}});
        await new Promise(resolve => setTimeout(resolve, 200));
        const layer = scene.deck.props.layers.find(layer => layer.id === 'routes');
        // South crossing runs east from -330: distances 330 and 350 are ink and gap.
        const inkPosition = layer.project([0, -265, 14]);
        const gapPosition = layer.project([20, -265, 14]);
        const ink = await scene.deck.pickObjectAsync({x: inkPosition[0], y: inkPosition[1]});
        const gap = await scene.deck.pickObjectAsync({x: gapPosition[0], y: gapPosition[1]});
        return {ink: ink?.object?.name, gap: gap?.object?.name};
      });
      assert.equal(picked.ink, 'South crossing', `${backend}: route picking`);
      assert.equal(picked.gap, 'South bridge', `${backend}: gaps pick the surface below`);
      await page.evaluate(() => window.strokeScene.setGeometryOptions({width: 0}));
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.strokeScene.deck.props.layers.find(layer => layer.id === 'routes').state.model.vertexCount), 0, `${backend}: zero width is empty`);
      await page.setViewportSize({width: 900, height: 650});
      await page.waitForFunction(() => window.strokeScene.deck.width === 900);
      await page.evaluate(() => {
        window.ownedVertices = window.strokeScene.deck.props.layers.find(layer => layer.id === 'routes').state.vertices;
        window.strokeScene.finalize(); window.strokeScene.finalize();
      });
      assert.equal(await page.evaluate(() => window.ownedVertices.destroyed), true, `${backend}: finalization releases owned geometry`);
      assert.deepEqual(errors, [], `${backend}: GPU and browser errors`);
      console.log(`${backend}: caps, joins, dashes, phase, picking gaps, resize, zero width, reuse and cleanup passed`);
    } finally {await browser.close();}
  }
} finally {await server.close();}
