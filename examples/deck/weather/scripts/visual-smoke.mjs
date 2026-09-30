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
function changedPixels(first, second) {
  let count = 0;
  for (let vertical = 0; vertical < first.height; vertical++)
    for (let horizontal = 310; horizontal < first.width; horizontal++) {
      const offset = (vertical * first.width + horizontal) * 4;
      if (
        [0, 1, 2].some(
          channel => Math.abs(first.data[offset + channel] - second.data[offset + channel]) > 10
        )
      )
        count++;
    }
  return count;
}
try {
  for (const backend of process.env.WEATHER_BACKEND
    ? [process.env.WEATHER_BACKEND]
    : ['webgpu', 'webgl']) {
    const browser = await chromium.launch(
      getPlaywrightLaunchOptions({
        headless: true,
        backend,
        softwareGpu: true,
        launchOptions:
          process.platform === 'linux' && backend === 'webgpu'
            ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']}
            : {}
      })
    );
    try {
      const page = await browser.newPage({viewport: {width: 1100, height: 800}});
      const errors = [];
      page.on('pageerror', error => {
        errors.push(error.message);
        console.error(error.message);
      });
      page.on('console', message => {
        if (message.type() === 'error') {
          errors.push(message.text());
          console.error(message.text());
        }
      });
      await page.goto(
        `${process.env.WEATHER_EXAMPLE_URL || server.resolvedUrls.local[0]}?backend=${backend}`
      );
      await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, {
        timeout: 60_000
      });
      await page.waitForFunction(() => window.weatherScene?.diagnostics.frames > 8, undefined, {
        timeout: 30_000
      });
      assert.equal(await page.evaluate(() => window.weatherScene.diagnostics.error), '', `${backend}: scene initialization`);
      const moving = PNG.sync.read(await page.screenshot());
      await page.waitForTimeout(350);
      assert(
        changedPixels(moving, PNG.sync.read(await page.screenshot())) > 200,
        `${backend}: rain moves`
      );
      await page.uncheck('#playing');
      await page.waitForTimeout(150);
      const paused = PNG.sync.read(
        await page.screenshot({path: join(tmpdir(), `weather-rain-${backend}.png`)})
      );
      await page.waitForTimeout(250);
      assert.equal(
        changedPixels(paused, PNG.sync.read(await page.screenshot())),
        0,
        `${backend}: pause freezes precipitation`
      );
      if (process.env.WEATHER_THUMBNAIL && backend === 'webgpu')
        await page.screenshot({path: process.env.WEATHER_THUMBNAIL, type: 'jpeg', quality: 90});
      await page.selectOption('#preset', 'snow');
      await page.waitForTimeout(150);
      const snow = PNG.sync.read(
        await page.screenshot({path: join(tmpdir(), `weather-snow-${backend}.png`)})
      );
      assert(changedPixels(paused, snow) > 500, `${backend}: snow differs from rain`);
      await page.check('#playing');
      await page.waitForTimeout(350);
      assert(
        changedPixels(snow, PNG.sync.read(await page.screenshot())) > 200,
        `${backend}: snow drifts`
      );
      await page.uncheck('#playing');
      await page.waitForTimeout(150);
      // Put snow inside an opaque building so this tests depth independently of roof masking.
      await page.evaluate(() => {
        const scene = window.weatherScene;
        window.originalWeatherLayers = scene.deck.props.layers;
        const building = scene.deck.props.layers.find(layer => layer.id === 'district').props.features.find(
          feature => feature.kind === 'building' && feature.center[0] === 122 && Math.abs(feature.center[1]) < 150
        );
        scene.deck.setProps({
          layers: scene.deck.props.layers.map(layer => layer.id === 'weather' ? layer.clone({
            particleCount: 2048,
            surfaceTexture: null,
            fog: {density: 0},
            widthPixels: 6,
            precipitation: {
              seed: 29, fallSpeed: 0, turbulence: 0, wind: [0, 0],
              volumeCenter: [building.center[0], building.center[1], building.center[2] + building.size[2] / 2],
              volumeSize: building.size.map(value => value * 0.25)
            }
          }) : layer)
        });
      });
      await page.waitForTimeout(150);
      const normalDepth = PNG.sync.read(await page.screenshot());
      await page.evaluate(() => {
        const scene = window.weatherScene;
        scene.deck.setProps({
          layers: scene.deck.props.layers.map(layer =>
            layer.id === 'weather'
              ? layer.clone({parameters: {...layer.props.parameters, depthCompare: 'always'}})
              : layer
          )
        });
      });
      await page.waitForTimeout(150);
      const occludedPixels = changedPixels(normalDepth, PNG.sync.read(await page.screenshot({path: join(tmpdir(), `weather-depth-always-${backend}.png`)})));
      assert(occludedPixels > 50, `${backend}: opaque scene depth hides snow (${occludedPixels} pixels)`);
      await page.evaluate(() =>
        window.weatherScene.deck.setProps({layers: window.originalWeatherLayers})
      );
      // Disabled precipitation must stop both the clock and frame requests, even with Animate enabled.
      await page.check('#playing');
      for (const preset of ['clear', 'fog', 'snow']) {
        await page.selectOption('#preset', preset);
        if (preset === 'snow') await page.evaluate(() => window.weatherScene.setIntensity(0));
        await page.waitForTimeout(250);
        const idle = await page.evaluate(() => ({...window.weatherScene.diagnostics}));
        await page.waitForTimeout(250);
        const settled = await page.evaluate(() => ({...window.weatherScene.diagnostics}));
        assert.equal(settled.frames, idle.frames, `${backend}: ${preset} disabled precipitation stops redraws`);
        assert.equal(settled.time, idle.time, `${backend}: ${preset} disabled precipitation freezes time`);
        await page.evaluate(() => window.weatherScene.setWindDirection(90));
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => window.weatherScene.diagnostics.time), idle.time,
          `${backend}: an idle settings redraw does not advance time`);
      }
      const stoppedTime = await page.evaluate(() => window.weatherScene.diagnostics.time);
      await page.evaluate(() => window.weatherScene.setIntensity(0.6));
      await page.waitForTimeout(250);
      assert(await page.evaluate(() => window.weatherScene.diagnostics.time) > stoppedTime,
        `${backend}: restoring particle count resumes animation`);
      await page.uncheck('#playing');
      await page.selectOption('#preset', 'fog');
      await page.evaluate(() => window.weatherScene.setVisibility(5000));
      await page.waitForTimeout(150);
      const thinFog = PNG.sync.read(await page.screenshot());
      await page.evaluate(() => window.weatherScene.setVisibility(300));
      await page.waitForTimeout(150);
      assert(
        changedPixels(
          thinFog,
          PNG.sync.read(await page.screenshot({path: join(tmpdir(), `weather-fog-${backend}.png`)}))
        ) > 10000,
        `${backend}: visibility changes world-space fog`
      );
      await page.selectOption('#projection', 'globe');
      await page.selectOption('#preset', 'snow');
      await page.evaluate(() => window.weatherScene.setVisibility(3000));
      await page.waitForTimeout(200);
      const globe = PNG.sync.read(await page.screenshot({path: join(tmpdir(), `weather-globe-${backend}.png`)}));
      const localCamera = await page.evaluate(() => {
        const layer = window.weatherScene.deck.layerManager.getLayers().find(layer => layer.id === 'weather');
        return Array.from(layer.state.model.shaderInputs.getUniformValues().weatherRender.cameraPosition);
      });
      assert(localCamera.every(Number.isFinite) && Math.hypot(...localCamera) < 10000, `${backend}: globe camera is local metres`);
      await page.evaluate(() => window.weatherScene.setIntensity(0));
      await page.waitForTimeout(150);
      assert(changedPixels(globe, PNG.sync.read(await page.screenshot())) > 200, `${backend}: snow remains visible on the globe`);
      await page.evaluate(() => window.weatherScene.setIntensity(0.6));
      await page.selectOption('#projection', 'map');
      await page.selectOption('#preset', 'snow');
      await page.evaluate(() => {
        window.weatherScene.setVisibility(5000);
        window.weatherScene.setIntensity(0);
      });
      await page.waitForTimeout(150);
      const noParticles = PNG.sync.read(await page.screenshot());
      await page.evaluate(() => {
        const scene = window.weatherScene;
        const texture = scene.surfaceTexture;
        texture.writeData(new Float32Array(texture.width * texture.height).fill(1000));
        scene.setIntensity(0.6);
        const layers = scene.deck.props.layers;
        scene.deck.setProps({
          layers: layers.map(layer =>
            layer.id === 'weather'
              ? layer.clone({surfaceBounds: [-100000, -100000, 100000, 100000]})
              : layer
          )
        });
      });
      await page.waitForTimeout(150);
      assert.equal(
        changedPixels(noParticles, PNG.sync.read(await page.screenshot())),
        0,
        `${backend}: surface heights suppress covered precipitation`
      );
      await page.evaluate(() => {
        window.borrowedWeatherSurface = window.weatherScene.surfaceTexture;
        window.weatherScene.deck.setProps({layers: []});
      });
      await page.waitForTimeout(150);
      assert.equal(
        await page.evaluate(() => window.borrowedWeatherSurface.destroyed),
        false,
        `${backend}: layer borrows surface texture`
      );
      await page.evaluate(() => {
        window.weatherScene.finalize();
        window.weatherScene.finalize();
      });
      assert.equal(
        await page.evaluate(() => window.borrowedWeatherSurface.destroyed),
        true,
        `${backend}: application releases surface texture`
      );
      assert.equal(await page.evaluate(() => window.weatherScene.diagnostics.error), '', `${backend}: scene errors`);
      assert.deepEqual(errors, [], `${backend}: GPU/browser errors`);
      console.log(
        `${backend}: rain, snow, fog, pause, depth occlusion, surface masking and cleanup passed`
      );
      if (backend === 'webgl') {
        for (const unavailable of ['absent', 'null', 'rejected']) {
          const fallbackPage = await browser.newPage();
          const fallbackErrors = [];
          fallbackPage.on('pageerror', error => fallbackErrors.push(error.message));
          await fallbackPage.addInitScript(mode => {
            Object.defineProperty(navigator, 'gpu', {value: mode === 'absent' ? undefined : {
              requestAdapter: async () => {
                if (mode === 'rejected') throw new Error('Adapter unavailable');
                return null;
              }
            }});
          }, unavailable);
          await fallbackPage.goto(process.env.WEATHER_EXAMPLE_URL || server.resolvedUrls.local[0]);
          await fallbackPage.waitForFunction(() => document.body.dataset.ready === 'true', undefined, {timeout: 60_000});
          assert.equal(await fallbackPage.evaluate(() => window.weatherScene.diagnostics.backend), 'webgl', `default falls back when WebGPU is ${unavailable}`);
          assert.equal(await fallbackPage.locator('#backend').inputValue(), 'webgl');
          await fallbackPage.evaluate(() => window.weatherScene.finalize());
          assert.deepEqual(fallbackErrors, []);
          await fallbackPage.close();
        }
        console.log('Default backend: absent, null and rejected WebGPU adapter fallback passed');
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
