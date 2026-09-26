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
      headless: true, backend, softwareGpu: process.env.CITY_SCENE_HARDWARE !== 'true'
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
      await page.uncheck('#buildings');
      const replacement = await page.evaluate(async () => {
        const scene = window.cityScene;
        const position = scene.deck.getViewports()[0].project([-74.006, 40.7128]);
        const info = await scene.deck.pickObjectAsync({x: position[0], y: position[1]});
        return info?.object?.kind;
      });
      assert.equal(replacement, 'water', `${backend}: river picking after layer replacement`);
      await page.check('#buildings');
      await page.selectOption('#camera', 'waterfront');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 68);
      await page.setViewportSize({width: 1000, height: 720});
      await page.waitForFunction(() => window.cityScene.deck.width === 1000);
      await page.selectOption('#camera', 'district');
      await page.waitForFunction(() => window.cityScene.deck.getViewports()[0].pitch === 52);
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
      const frames = await page.evaluate(() => window.cityScene.diagnostics.frames);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.cityScene.diagnostics.frames), frames, 'finalization stops rendering');
      assert.deepEqual(errors, [], `${backend}: browser errors`);
      process.stdout.write(`${backend}: picking, layer replacement, camera, resize, finalization passed. ${screenshotPath}\n`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
