// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

// WebGPU requires a secure origin; setContent/about:blank cannot exercise it.
const server = createServer((request, response) => {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<style>body {margin: 0}</style><canvas width="64" height="64"></canvas>');
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
let browser;
try {
  browser = await chromium.launch(getPlaywrightLaunchOptions({
    headless: true,
    softwareGpu: process.platform === 'linux'
  }));
  for (const backend of ['webgl2', 'webgpu']) {
    const page = await browser.newPage({viewport: {width: 64, height: 64}, deviceScaleFactor: 1});
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.evaluate(async backend => {
        const canvas = document.querySelector('canvas');
        if (backend === 'webgl2') {
          const context = canvas.getContext('webgl2', {preserveDrawingBuffer: true});
          if (!context) throw new Error('WebGL2 adapter unavailable');
          context.clearColor(1, 0, 0, 1);
          context.clear(context.COLOR_BUFFER_BIT);
          context.finish();
        } else {
          const adapter = await navigator.gpu?.requestAdapter();
          if (!adapter) throw new Error('WebGPU adapter unavailable');
          const device = await adapter.requestDevice();
          const context = canvas.getContext('webgpu');
          context.configure({device, format: navigator.gpu.getPreferredCanvasFormat(), alphaMode: 'opaque'});
          const encoder = device.createCommandEncoder();
          encoder.beginRenderPass({colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: {r: 1, g: 0, b: 0, a: 1},
            loadOp: 'clear',
            storeOp: 'store'
          }]}).end();
          device.queue.submit([encoder.finish()]);
          let timeout;
          try {
            await Promise.race([
              device.queue.onSubmittedWorkDone(),
              device.lost.then(info => {throw new Error(`WebGPU device lost: ${info.message}`);}),
              new Promise((resolve, reject) => {
                timeout = setTimeout(() => reject(new Error('WebGPU submission timed out')), 15_000);
              })
            ]);
          } finally {
            clearTimeout(timeout);
          }
        }
        // Allow the submitted canvas frame to reach the compositor before capture.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, backend);
      // Capture the canvas region directly, as SnapshotTestRunner does. Element
      // screenshots wait for layout stability and can stall with software compositing.
      const capture = PNG.sync.read(await page.screenshot({
        clip: {x: 0, y: 0, width: 64, height: 64}
      }));
      assert.equal(capture.width, 64);
      assert.equal(capture.height, 64);
      let redPixelCount = 0;
      for (let offset = 0; offset < capture.data.length; offset += 4) {
        if (capture.data[offset] >= 250 && capture.data[offset + 1] <= 5 &&
            capture.data[offset + 2] <= 5 && capture.data[offset + 3] === 255) redPixelCount++;
      }
      assert.equal(redPixelCount, 64 * 64,
        `${backend} canvas capture is broken (${redPixelCount}/4096 red pixels). On Linux use xvfb-run with Vulkan compositing.`);
      console.log(`${backend}: captured ${redPixelCount} red pixels`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
