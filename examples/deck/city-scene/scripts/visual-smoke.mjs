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
const url = server.resolvedUrls?.local[0];
assert(url);
try {
  for (const backend of ['webgpu', 'webgl']) {
    const browser = await chromium.launch(getPlaywrightLaunchOptions({
      headless: true, backend, softwareGpu: process.env.CITY_SCENE_HARDWARE !== 'true',
      // Linux canvas presentation needs the Vulkan compositor and an X display (see #2874).
      launchOptions: process.platform === 'linux' && backend === 'webgpu'
        ? {args: ['--enable-gpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader']}
        : {}
    }));
    try {
      const page = await browser.newPage({viewport: {width: 1200, height: 850}});
      const errors = [];
      page.on('pageerror', error => { errors.push(error.message); process.stderr.write(`${error.message}\n`); });
      page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); process.stderr.write(`${message.text()}\n`); } });
      await page.goto(`${url}?backend=${backend}`);
      await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, {timeout: 60_000});
      await page.waitForFunction(() => window.cityScene?.diagnostics.frames > 0);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.backend), backend);
      assert.deepEqual(
        await page.evaluate(() =>
          window.cityScene.deck.props.layers.find(layer => layer?.id === 'river-water')?.props.flowDirection
        ),
        [0, 1],
        `${backend}: river flow follows its north-south footprint axis`
      );
      await page.waitForFunction(() => window.cityScene.diagnostics.timeSeconds > 0);
      const playingWaterImage = PNG.sync.read(await page.screenshot({path: join(process.env.CITY_SCENE_ARTIFACTS ?? tmpdir(), `city-scene-${backend}-playing.png`)}));
      await page.waitForTimeout(650);
      const movingWaterImage = PNG.sync.read(await page.screenshot());
      let animatedWaterPixels = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const offset = (vertical * playingWaterImage.width + horizontal) * 4;
          const colorDifference = Math.max(
            Math.abs(playingWaterImage.data[offset] - movingWaterImage.data[offset]),
            Math.abs(playingWaterImage.data[offset + 1] - movingWaterImage.data[offset + 1]),
            Math.abs(playingWaterImage.data[offset + 2] - movingWaterImage.data[offset + 2])
          );
          if (colorDifference > 3) animatedWaterPixels++;
        }
      }
      assert(animatedWaterPixels > 100, `${backend}: water visibly moves during playback (${animatedWaterPixels} pixels)`);
      await page.click('#playback');
      await page.mouse.move(1190, 840);
      await page.waitForTimeout(150);
      const pausedFrames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), pausedFrames, `${backend}: pause stops drawing`);
      if (backend === 'webgpu') {
        await page.evaluate(() => {
          window.cityScene.setTime(2);
          window.cityScene.setReflectionDebugMode(1);
        });
        await page.waitForTimeout(250);
        const reflections = PNG.sync.read(await page.screenshot({path: join(process.env.CITY_SCENE_ARTIFACTS ?? tmpdir(), 'city-scene-reflections.png')}));
        let reflectedPixels = 0;
        for (let vertical = 120; vertical < 650; vertical++) {
          for (let horizontal = 350; horizontal < 950; horizontal++) {
            const offset = (vertical * reflections.width + horizontal) * 4;
            if (Math.max(...reflections.data.subarray(offset, offset + 3)) > 8) reflectedPixels++;
          }
        }
        assert(reflectedPixels > 1000, `SSR traces visible scene reflections (${reflectedPixels} pixels)`);
        await page.evaluate(() => {
          window.cityScene.setReflectionDebugMode(0);
          window.reflectionTexture = window.cityScene.deck.props.effects[0].normalTexture;
        });
        await page.uncheck('#reflections');
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => window.reflectionTexture.destroyed), true, 'disabling SSR releases auxiliary textures');
        await page.check('#reflections');
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => window.cityScene.deck.props.effects[0].normalTexture.destroyed), false, 'enabling SSR recreates auxiliary textures');
      } else {
        assert(await page.locator('#reflections').isDisabled(), 'WebGL clearly disables the WebGPU reflection pass');
      }
      await page.selectOption('#camera', 'overhead');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 0);
      await page.screenshot({path: join(process.env.CITY_SCENE_ARTIFACTS ?? tmpdir(), `city-scene-${backend}-overhead.png`)});
      const picked = await page.evaluate(async () => {
        const position = window.cityScene.getFeatureScreenPosition('East 4.1');
        if (!position) throw new Error('Missing fixture building');
        const info = await window.cityScene.deck.pickObjectAsync({x: position[0], y: position[1]});
        return info?.object?.name;
      });
      assert.equal(picked, 'East 4.1', `${backend}: geographic roof picking`);
      const position = await page.evaluate(() => window.cityScene.getFeatureScreenPosition('East 4.1'));
      assert(position);
      await page.mouse.click(position[0], position[1]);
      await page.waitForFunction(() => window.cityScene.diagnostics.selected === 'East 4.1');
      const neighborhood = await page.evaluate(async () => {
        const position = window.cityScene.getFeatureScreenPosition('East 4.1');
        const hits = await window.cityScene.deck.pickObjectsAsync({
          x: position[0] - 5, y: position[1] - 9, width: 10, height: 18
        });
        return hits.map(hit => hit.object?.name);
      });
      assert(neighborhood.includes('East 4.1'), `${backend}: multi-row picking readback`);
      const framesBeforeReplacement = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.uncheck('#buildings');
      await page.waitForFunction(previousFrames => window.cityScene.diagnostics.frames > previousFrames && window.cityScene.deck.props.layers.find(layer => layer?.id === 'city-mesh').isLoaded, framesBeforeReplacement);
      const replacement = await page.evaluate(async () => {
        const scene = window.cityScene;
        const position = scene.deck.getViewports()[0].project([-74.006, 40.7128]);
        const info = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
        return info?.object?.kind;
      });
      assert.equal(replacement, 'water', `${backend}: river picking after layer replacement`);
      const bridge = await page.evaluate(async () => {
        const position = window.cityScene.getFeatureScreenPosition('North bridge');
        const info = await window.cityScene.deck.pickObjectAsync({x: position[0], y: position[1]});
        return info?.object?.kind;
      });
      assert.equal(bridge, 'bridge', `${backend}: bridge occludes the water surface`);
      await page.evaluate(() => {
        window.borrowedWaterPositions = window.cityScene.deck.props.layers.find(layer => layer?.id === 'river-water').props.positions;
      });
      await page.uncheck('#water');
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => window.borrowedWaterPositions.destroyed), false, 'removing water preserves borrowed positions');
      await page.check('#water');
      await page.waitForFunction(() => window.cityScene.deck.props.layers.some(layer => layer?.id === 'river-water'));
      await page.check('#buildings');
      await page.selectOption('#camera', 'waterfront');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 68);
      await page.setViewportSize({width: 1000, height: 720});
      await page.waitForFunction(() => window.cityScene.deck.width === 1000);
      await page.selectOption('#camera', 'district');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 52);
      await page.mouse.move(990, 710);
      await page.evaluate(() => window.cityScene.setTime(2));
      await page.waitForTimeout(100);
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
      const firstWaterImage = PNG.sync.read(await page.screenshot());
      await page.selectOption('#water-preset', 'slate');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#water-color').inputValue(), '#67747a');
      const slateWaterImage = PNG.sync.read(await page.screenshot());
      let slateChangedPixels = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const offset = (vertical * firstWaterImage.width + horizontal) * 4;
          if (Math.abs(firstWaterImage.data[offset] - slateWaterImage.data[offset]) > 3 ||
              Math.abs(firstWaterImage.data[offset + 1] - slateWaterImage.data[offset + 1]) > 3 ||
              Math.abs(firstWaterImage.data[offset + 2] - slateWaterImage.data[offset + 2]) > 3) {
            slateChangedPixels++;
          }
        }
      }
      assert(slateChangedPixels > 1000, `${backend}: slate preset changes water tint (${slateChangedPixels} pixels)`);
      await page.selectOption('#water-preset', 'teal');
      await page.waitForTimeout(100);
      await page.locator('#water-color').evaluate(input => {
        input.value = '#d47a24';
        input.dispatchEvent(new Event('input', {bubbles: true}));
      });
      await page.waitForTimeout(100);
      const coloredWaterImage = PNG.sync.read(await page.screenshot());
      let colorChangedPixels = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const offset = (vertical * firstWaterImage.width + horizontal) * 4;
          if (Math.abs(firstWaterImage.data[offset] - coloredWaterImage.data[offset]) > 3 ||
              Math.abs(firstWaterImage.data[offset + 1] - coloredWaterImage.data[offset + 1]) > 3 ||
              Math.abs(firstWaterImage.data[offset + 2] - coloredWaterImage.data[offset + 2]) > 3) {
            colorChangedPixels++;
          }
        }
      }
      assert(colorChangedPixels > 1000, `${backend}: river color selector changes water appearance (${colorChangedPixels} pixels)`);
      await page.locator('#water-color').evaluate(input => {
        input.value = '#0b4252';
        input.dispatchEvent(new Event('input', {bubbles: true}));
      });
      await page.waitForTimeout(100);
      await page.selectOption('#water-style', 'classic');
      await page.waitForTimeout(100);
      const classicWaterImage = PNG.sync.read(await page.screenshot());
      let styleChangedPixels = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const offset = (vertical * firstWaterImage.width + horizontal) * 4;
          if (Math.abs(firstWaterImage.data[offset] - classicWaterImage.data[offset]) > 3)
            styleChangedPixels++;
        }
      }
      assert(styleChangedPixels > 1000, `${backend}: river and classic water styles differ (${styleChangedPixels} pixels)`);
      await page.selectOption('#water-style', 'river');
      await page.waitForTimeout(100);
      await page.evaluate(() => window.cityScene.setTime(8));
      await page.waitForTimeout(100);
      const secondWaterImage = PNG.sync.read(await page.screenshot());
      let changedPixels = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const offset = (vertical * firstWaterImage.width + horizontal) * 4;
          if (Math.abs(firstWaterImage.data[offset] - secondWaterImage.data[offset]) > 3) changedPixels++;
        }
      }
      assert(changedPixels > 100, `${backend}: time changes water shading (${changedPixels} pixels)`);
      await page.evaluate(() => window.cityScene.setTime(2));
      await page.waitForTimeout(100);
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
      const repeatedWaterImage = PNG.sync.read(await page.screenshot());
      let replayDifferences = 0;
      for (let vertical = 120; vertical < 650; vertical++) {
        for (let horizontal = 350; horizontal < 950; horizontal++) {
          const index = (vertical * firstWaterImage.width + horizontal) * 4;
          const colorDifference = Math.max(
            Math.abs(repeatedWaterImage.data[index] - firstWaterImage.data[index]),
            Math.abs(repeatedWaterImage.data[index + 1] - firstWaterImage.data[index + 1]),
            Math.abs(repeatedWaterImage.data[index + 2] - firstWaterImage.data[index + 2])
          );
          if (colorDifference > 1) replayDifferences++;
        }
      }
      assert.equal(replayDifferences, 0, `${backend}: replaying time is deterministic`);
      const screenshotPath = join(process.env.CITY_SCENE_ARTIFACTS ?? tmpdir(), `city-scene-${backend}.png`);
      const screenshot = PNG.sync.read(await page.screenshot({path: screenshotPath}));
      const colors = new Set();
      // Inspect the scene to the right of the controls, rather than counting text or UI pixels.
      for (let vertical = 120; vertical < 650; vertical += 3) {
        for (let horizontal = 350; horizontal < 950; horizontal += 3) {
          const offset = (vertical * screenshot.width + horizontal) * 4;
          colors.add(screenshot.data.subarray(offset, offset + 3).toString('hex'));
        }
      }
      assert(colors.size > 20, `${backend}: scene contains shaded geometry`);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.error), '');
      await page.evaluate(() => { window.cityScene.finalize(); window.cityScene.finalize(); });
      assert.equal(await page.evaluate(() => window.borrowedWaterPositions.destroyed), true, 'application releases water positions on finalization');
      const frames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), frames, 'finalization stops rendering');
      assert.deepEqual(errors, [], `${backend}: browser errors`);
      process.stdout.write(`${backend}: animated water, deterministic time, pause, picking, buffer ownership, camera, resize, finalization passed. ${screenshotPath}\n`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
