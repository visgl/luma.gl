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
function countBrightened(first, second) {
  let count = 0;
  const scale = first.width / 1100;
  for (let vertical = 0; vertical < first.height; vertical++) {
    for (let horizontal = 300 * scale; horizontal < first.width; horizontal++) {
      const offset = (vertical * first.width + horizontal) * 4;
      if ([0, 1, 2].some(channel => second.data[offset + channel] - first.data[offset + channel] > 8)) count++;
    }
  }
  return count;
}
try {
  for (const backend of process.env.GLOW_BACKEND ? [process.env.GLOW_BACKEND] : ['webgpu', 'webgl']) {
    const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend, softwareGpu: true,
      launchOptions: process.platform === 'linux' && backend === 'webgpu'
        ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']} : {}}));
    try {
      const page = await browser.newPage({viewport: {width: 1100, height: 800}, deviceScaleFactor: backend === 'webgpu' ? 2 : 1});
      const errors = [];
      page.on('pageerror', error => {errors.push(error.message); console.error(error.message);});
      page.on('console', message => {if (message.type() === 'error') {errors.push(message.text()); console.error(message.text());}});
      await page.goto(`${process.env.GLOW_EXAMPLE_URL || server.resolvedUrls.local[0]}?backend=${backend}`);
      await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, {timeout: 60_000});
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.glowScene.diagnostics.error), '', `${backend}: initialization`);
      const glow = PNG.sync.read(await page.screenshot({path: join(tmpdir(), `point-glow-${backend}.png`)}));
      if (process.env.GLOW_THUMBNAIL && backend === 'webgpu') await page.screenshot({path: process.env.GLOW_THUMBNAIL, type: 'jpeg', quality: 90});
      await page.evaluate(() => {window.borrowedPoints = window.glowScene.points; window.originalModel = window.glowScene.deck.props.layers.find(layer => layer.id === 'lights').state.model;});
      await page.uncheck('#enabled');
      await page.waitForTimeout(150);
      const unlit = PNG.sync.read(await page.screenshot());
      assert(countBrightened(unlit, glow) > 500, `${backend}: halos add visible light`);
      assert.equal(countBrightened(glow, unlit), 0, `${backend}: additive light does not darken surfaces`);
      await page.check('#enabled');
      await page.evaluate(() => window.glowScene.setStyle({haloIntensity: 1}));
      await page.waitForTimeout(150);
      assert(countBrightened(glow, PNG.sync.read(await page.screenshot())) > 100, `${backend}: halo intensity is adjustable`);
      assert.equal(await page.evaluate(() => window.originalModel === window.glowScene.deck.props.layers.find(layer => layer.id === 'lights').state.model), true, `${backend}: style updates reuse model`);
      await page.evaluate(() => {
        const scene = window.glowScene;
        scene.deck.setProps({layers: scene.deck.props.layers.map(layer => layer.id === 'lights' ? layer.clone({pointCount: 0}) : layer)});
      });
      await page.waitForTimeout(150);
      assert.equal(countBrightened(unlit, PNG.sync.read(await page.screenshot())), 0, `${backend}: zero points skip drawing`);
      await page.evaluate(() => window.glowScene.rebuildLayers());
      await page.waitForTimeout(150);
      const picked = await page.evaluate(async () => {
        const scene = window.glowScene;
        scene.deck.setProps({initialViewState: {longitude: -74.006, latitude: 40.7128, zoom: 15.6, pitch: 0, bearing: 0}});
        await new Promise(resolve => setTimeout(resolve, 150));
        const feature = scene.features.find(feature => feature.name === 'East bank light 21');
        const layer = scene.deck.props.layers.find(layer => layer.id === 'lights');
        const position = layer.project(feature.position);
        const center = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
        const halo = await scene.deck.pickObjectAsync({x: position[0] + 10, y: position[1]});
        return {center: center?.object?.name, halo: halo?.object?.name};
      });
      assert.equal(picked.center, 'East bank light 21', `${backend}: picks the point feature`);
      assert.notEqual(picked.halo, picked.center, `${backend}: soft halo does not capture clicks`);
      const occluded = await page.evaluate(async () => {
        const scene = window.glowScene;
        const featureIndex = scene.features.findIndex(feature => feature.name === 'East 4.1 rooftop beacon');
        const feature = scene.features[featureIndex];
        const layer = scene.deck.props.layers.find(layer => layer.id === 'lights');
        const position = layer.project(feature.position);
        const before = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
        scene.points.write(new Float32Array([feature.position[0], feature.position[1], 0]), featureIndex * 32);
        scene.rebuildLayers();
        await new Promise(resolve => setTimeout(resolve, 150));
        const after = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
        scene.points.write(new Float32Array(feature.position), featureIndex * 32);
        return {before: before?.object?.name, after: after?.object?.name};
      });
      assert.equal(occluded.before, 'East 4.1 rooftop beacon', `${backend}: visible rooftop beacon picks`);
      assert.equal(occluded.after, 'East 4.1', `${backend}: opaque roof occludes a hidden beacon during picking`);
      await page.evaluate(() => window.glowScene.deck.setProps({layers: []}));
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.borrowedPoints.destroyed), false, `${backend}: layer does not destroy borrowed points`);
      await page.evaluate(() => window.glowScene.rebuildLayers());
      await page.setViewportSize({width: 900, height: 650});
      await page.waitForFunction(() => window.glowScene.deck.width === 900);
      await page.evaluate(() => {window.glowScene.finalize(); window.glowScene.finalize();});
      assert.equal(await page.evaluate(() => window.borrowedPoints.destroyed), true, `${backend}: owner releases points`);
      assert.deepEqual(errors, [], `${backend}: browser and GPU errors`);
      console.log(`${backend}: additive halos, intensity, uniform reuse, picking, occlusion, resize, borrowed buffers and cleanup passed`);
    } finally {await browser.close();}
  }
} finally {await server.close();}
