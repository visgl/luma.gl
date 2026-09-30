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
      const normalDepth = PNG.sync.read(await page.screenshot());
      await page.evaluate(() => {
        const scene = window.weatherScene;
        window.originalWeatherLayers = scene.deck.props.layers;
        scene.deck.setProps({
          layers: scene.deck.props.layers.map(layer =>
            layer.id === 'weather'
              ? layer.clone({parameters: {...layer.props.parameters, depthCompare: 'always'}})
              : layer
          )
        });
      });
      await page.waitForTimeout(150);
      assert(
        changedPixels(normalDepth, PNG.sync.read(await page.screenshot())) > 50,
        `${backend}: opaque scene depth hides snow`
      );
      await page.evaluate(() =>
        window.weatherScene.deck.setProps({layers: window.originalWeatherLayers})
      );
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
      assert.deepEqual(errors, [], `${backend}: GPU/browser errors`);
      console.log(
        `${backend}: rain, snow, fog, pause, depth occlusion, surface masking and cleanup passed`
      );
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
