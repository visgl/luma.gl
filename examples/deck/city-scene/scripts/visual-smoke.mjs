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
      await page.goto(`${process.env.CITY_SCENE_URL || url}?backend=${backend}`);
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
      if (backend === 'webgpu') {
        assert(await page.evaluate(() => window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections').historyFrames > 1), 'SSR accumulates successive frames');
      }
      await page.click('#playback');
      await page.mouse.move(1190, 840);
      await page.waitForTimeout(150);
      const pausedFrames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), pausedFrames, `${backend}: pause stops drawing`);
      if (backend === 'webgpu') {
        const restartedHistoryFrames = await page.evaluate(() => {
          window.cityScene.setTime(2);
          const frames = window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections').historyFrames;
          window.cityScene.setReflectionDebugMode(1);
          return frames;
        });
        assert.equal(restartedHistoryFrames, 1, 'time reset starts fresh reflection history');
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
        // Fixed water/camera isolates stochastic ray noise from physical surface animation.
        await page.evaluate(() => {
          const effect = window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections');
          const renderer = effect.renderer;
          const render = renderer.renderToTexture.bind(renderer);
          window.reflectionHistoryWeight = 0;
          renderer.renderToTexture = options => render({...options, uniforms: {...options.uniforms,
            ssrCameraTemporal: {...options.uniforms.ssrCameraTemporal, historyWeight: window.reflectionHistoryWeight}
          }});
          window.restoreReflectionRenderer = () => {renderer.renderToTexture = render;};
        });
        const variation = [];
        for (const historyWeight of [0, 0.8]) {
          await page.evaluate(weight => {
            window.reflectionHistoryWeight = weight;
            window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections').resetHistory();
            for (let frame = 0; frame < 8; frame++) window.cityScene.deck.redraw('warm reflection history');
          }, historyWeight);
          let previous = PNG.sync.read(await page.screenshot());
          let difference = 0;
          for (let frame = 0; frame < 5; frame++) {
            await page.evaluate(() => window.cityScene.deck.redraw('sample reflection history'));
            const current = PNG.sync.read(await page.screenshot());
            for (let vertical = 120; vertical < 650; vertical++) for (let horizontal = 350; horizontal < 950; horizontal++) {
              const offset = (vertical * current.width + horizontal) * 4;
              for (let channel = 0; channel < 3; channel++) difference += Math.abs(current.data[offset + channel] - previous.data[offset + channel]);
            }
            previous = current;
          }
          variation.push(difference);
        }
        await page.evaluate(() => window.restoreReflectionRenderer());
        assert(variation[0] > 1000, 'stochastic reflection rays produce measurable variation');
        assert(variation[1] < variation[0] * 0.8, `SSR history reduces static-scene flicker (${variation.join(' -> ')})`);
        process.stdout.write(`SSR static-scene variation: ${variation.join(' -> ')}\n`);

        // Quality switches replace only postprocessing targets, retaining shared scene capture.
        for (const [quality, scale] of [['fast', 0.25], ['detailed', 1], ['balanced', 0.5]]) {
          await page.evaluate(() => {
            const effect = window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections');
            window.previousReflectionTexture = effect.renderer.passRenderers[0].renderTargets.ssrRaw.texture;
            window.previousCaptureTexture = effect.capture.getFrame('city').buffer.colorTexture;
          });
          await page.selectOption('#reflection-quality', quality);
          const targets = await page.evaluate(() => {
            const effect = window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections');
            const capture = effect.capture.getFrame('city').buffer;
            const targets = effect.renderer.passRenderers[0].renderTargets;
            return {
              released: window.previousReflectionTexture.destroyed,
              captureReused: capture.colorTexture === window.previousCaptureTexture,
              width: targets.ssrRaw.texture.width,
              expectedWidth: capture.width,
              historyWidth: targets.ssrHistoryDepth.texture.width,
              historyFrames: effect.historyFrames
            };
          });
          assert(targets.released, `${quality}: switching quality releases old reflection targets`);
          assert(targets.captureReused, `${quality}: quality reuses scene capture`);
          assert.equal(targets.width, Math.max(1, Math.ceil(targets.expectedWidth * scale)));
          assert.equal(targets.historyWidth, targets.expectedWidth, 'camera depth history remains full resolution');
          assert(targets.historyFrames >= 1 && targets.historyFrames <= 2, 'quality starts fresh history');
          for (let frame = 0; frame < 4; frame++) await page.evaluate(() => window.cityScene.deck.redraw('warm quality preset'));
          const qualityImage = PNG.sync.read(await page.screenshot());
          let litPixels = 0;
          for (let vertical = 120; vertical < 650; vertical++) for (let horizontal = 350; horizontal < 950; horizontal++) {
            const offset = (vertical * qualityImage.width + horizontal) * 4;
            if (Math.max(...qualityImage.data.subarray(offset, offset + 3)) > 8) litPixels++;
          }
          assert(litPixels > 1000, `${quality}: produces visible reflection radiance`);
        }

        await page.evaluate(() => {
          window.cityScene.setReflectionDebugMode(0);
          window.reflectionTexture = window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections').capture.getFrame('city').buffer.normalRoughnessTexture;
        });
        await page.uncheck('#reflections');
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => window.reflectionTexture.destroyed), true, 'disabling SSR releases auxiliary textures');
        await page.check('#reflections');
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => window.cityScene.deck.props.effects.find(effect => effect.id === 'city-river-reflections').capture.getFrame('city').buffer.normalRoughnessTexture.destroyed), false, 'enabling SSR recreates auxiliary textures');
      } else {
        assert(await page.locator('#reflection-quality').isDisabled(), 'WebGL disables reflection quality');
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
      // Test material replay independently of SSR's intentionally stochastic redraw history.
      if (backend === 'webgpu') await page.uncheck('#reflections');
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
      if (backend === 'webgpu') {
        await page.check('#reflections');
        await page.waitForTimeout(150);
      }
      // Compose the existing edge layer with water and the shared SSR capture.
      await page.selectOption('#camera', 'overhead');
      await page.waitForTimeout(150);
      const roof = await page.evaluate(() => {
        const scene = window.cityScene;
        const building = scene.features.find(feature => feature.name === 'East 4.1');
        const layer = scene.deck.props.layers.find(layer => layer?.id === 'city-mesh');
        const corners = [-1, 1].flatMap(east => [-1, 1].map(north => layer.project([
          building.center[0] + east * building.size[0] / 2,
          building.center[1] + north * building.size[1] / 2,
          building.center[2] + building.size[2]
        ])));
        return [Math.floor(Math.min(...corners.map(point => point[0])) - 8),
          Math.floor(Math.min(...corners.map(point => point[1])) - 8),
          Math.ceil(Math.max(...corners.map(point => point[0])) + 8),
          Math.ceil(Math.max(...corners.map(point => point[1])) + 8)];
      });
      function changedRoofPixels(first, second) {
        let count = 0;
        for (let vertical = Math.max(0, roof[1]); vertical < Math.min(first.height, roof[3]); vertical++) {
          for (let horizontal = Math.max(300, roof[0]); horizontal < Math.min(first.width, roof[2]); horizontal++) {
            const offset = (vertical * first.width + horizontal) * 4;
            if ([0, 1, 2].some(channel => Math.abs(first.data[offset + channel] - second.data[offset + channel]) > 3)) count++;
          }
        }
        return count;
      }
      for (const reflections of backend === 'webgpu' ? [false, true] : [false]) {
        if (backend === 'webgpu') await page.locator('#reflections').setChecked(reflections);
        await page.selectOption('#edge-style', 'none');
        await page.waitForTimeout(100);
        const ordinaryRoof = PNG.sync.read(await page.screenshot());
        await page.selectOption('#edge-style', 'solid');
        await page.waitForTimeout(100);
        const solidRoof = PNG.sync.read(await page.screenshot());
        assert(changedRoofPixels(ordinaryRoof, solidRoof) > 20, `${backend}: solid edges visible with SSR=${reflections}`);
        await page.evaluate(() => {
          const layer = window.cityScene.deck.props.layers.find(layer => layer?.id === 'city-building-edges');
          window.cityDistrictVertices = window.cityScene.deck.props.layers.find(layer => layer?.id === 'city-mesh').state.vertices;
          window.borrowedCityEdges = layer.props.segments;
          window.cityEdgeCorners = layer.state.corners;
        });
        await page.selectOption('#edge-style', 'pencil');
        await page.waitForTimeout(100);
        assert(changedRoofPixels(solidRoof, PNG.sync.read(await page.screenshot())) > 20,
          `${backend}: pencil grain changes the roof edges with SSR=${reflections}`);
        assert(await page.evaluate(() => {
          const layer = window.cityScene.deck.props.layers.find(layer => layer?.id === 'city-building-edges');
          return layer.props.segments === window.borrowedCityEdges && layer.state.corners === window.cityEdgeCorners &&
            window.cityScene.deck.props.layers.find(candidate => candidate?.id === 'city-mesh').state.vertices === window.cityDistrictVertices;
        }), 'edge style changes reuse district geometry, borrowed segments, and layer resources');
        if (reflections) assert.equal(await page.evaluate(() => {
          const scene = window.cityScene;
          const layer = scene.deck.props.layers.find(layer => layer?.id === 'city-building-edges');
          return scene.deck.props.effects.find(effect => effect.id === 'city-scene-buffers').props.getLayerOptions(layer).mode;
        }), 'transparent', 'edges contribute color without replacing opaque depth or normals');
      }
      await page.selectOption('#edge-style', 'solid');
      const framesBeforeWidth = await page.evaluate(() => {
        const scene = window.cityScene;
        const frames = scene.diagnostics.frames;
        scene.setEdgeWidth(4);
        return frames;
      });
      await page.waitForFunction(frames => window.cityScene.diagnostics.frames > frames, framesBeforeWidth);
      const edgePicking = await page.evaluate(async () => {
        const scene = window.cityScene;
        const building = scene.features.find(feature => feature.name === 'East 4.1');
        const layer = scene.deck.props.layers.find(layer => layer?.id === 'city-mesh');
        const positions = [
          [building.center[0], building.center[1] + building.size[1] / 2, building.center[2] + building.size[2]],
          [building.center[0], building.center[1] - building.size[1] / 2, building.center[2]]
        ].map(position => layer.project(position));
        const hits = [];
        for (const position of positions) {
          const hit = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
          hits.push({name: hit?.object?.name, layer: hit?.layer.id});
        }
        return hits;
      });
      assert.deepEqual(edgePicking[0], {name: 'East 4.1', layer: 'city-building-edges'}, `${backend}: roof edges pick their building`);
      assert.deepEqual(edgePicking[1], {name: 'East 4.1', layer: 'city-mesh'}, `${backend}: opaque roof occludes the bottom edge`);
      await page.uncheck('#water');
      await page.evaluate(() => window.cityScene.setPlaying(true));
      await page.waitForTimeout(150);
      const staticFrames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), staticFrames, 'static edges do not animate when water is disabled');
      assert(await page.evaluate(() => window.cityScene.deck.props.layers.some(layer => layer?.id === 'city-building-edges')), 'water toggle preserves building edges');
      await page.uncheck('#buildings');
      await page.waitForTimeout(100);
      assert(await page.evaluate(() => window.cityEdgeCorners.destroyed && !window.borrowedCityEdges.destroyed), 'hiding buildings releases edge-layer resources but preserves borrowed segments');
      assert(!await page.evaluate(() => window.cityScene.deck.props.layers.some(layer => layer?.id === 'city-building-edges')), 'hidden buildings have no stray strokes');
      await page.check('#buildings');
      await page.check('#water');
      await page.selectOption('#edge-style', 'pencil');
      await page.evaluate(() => {window.cityScene.setTime(2); window.cityScene.setEdgeWidth(2.2);});
      await page.selectOption('#camera', 'waterfront');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 68);
      await page.waitForTimeout(100);
      await page.screenshot({path: join(process.env.CITY_SCENE_ARTIFACTS ?? tmpdir(), `city-scene-${backend}-pencil-waterfront.png`)});
      assert(await page.evaluate(() => window.cityScene.deck.props.layers.find(layer => layer?.id === 'city-building-edges').props.segments === window.borrowedCityEdges), 'camera changes preserve world-anchored edge geometry');
      await page.selectOption('#camera', 'district');
      await page.waitForTimeout(150);
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
      assert(await page.evaluate(() => window.borrowedCityEdges.destroyed), 'application releases edge segments on finalization');
      const frames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), frames, 'finalization stops rendering');
      assert.deepEqual(errors, [], `${backend}: browser errors`);
      process.stdout.write(`${backend}: animated water, shared building edges, SSR composition, deterministic time, pause, picking, buffer ownership, camera, resize, finalization passed. ${screenshotPath}\n`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
