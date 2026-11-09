// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// node scripts/benchmarks/texture-write-data.mjs [checkout-to-measure]
// Requires installed workspace dependencies and Playwright Chromium.
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const root = resolve(process.argv[2] || '.');
const writesPerBatch = 1500;
const batchCount = 120;
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: 'ts',
    contents: `
      import {luma} from './modules/core/src/index';
      import {webgl2Adapter} from './modules/core/src/webgl/index';
      globalThis.benchmarkReady = (async () => {
        const device = await luma.createDevice({
          type: 'webgl', adapters: [webgl2Adapter], debug: false,
          createCanvasContext: {canvas: document.createElement('canvas'), width: 4, height: 4}
        });
        const texture = device.createTexture({format: 'rgba8unorm', width: 4, height: 4});
        const data = new Uint8Array(16).fill(127);
        const options = {width: 4, height: 1};
        const gl = device.gl;
        return {
          configure(matching) {
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, matching ? 1 : 4);
            gl.pixelStorei(gl.UNPACK_ROW_LENGTH, matching ? 4 : 0);
            gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, matching ? 1 : 0);
          },
          async run(batchCount, writesPerBatch, yieldFrames) {
            let cpuMilliseconds = 0;
            const started = performance.now();
            for (let batch = 0; batch < batchCount; batch++) {
              const batchStarted = performance.now();
              for (let write = 0; write < writesPerBatch; write++) texture.writeData(data, options);
              cpuMilliseconds += performance.now() - batchStarted;
              if (yieldFrames) await new Promise(requestAnimationFrame);
            }
            return {cpuMilliseconds, elapsedMilliseconds: performance.now() - started};
          },
          destroy() {texture.destroy(); device.destroy();}
        };
      })();
    `
  },
  bundle: true,
  format: 'iife',
  write: false
});

const browser = await chromium.launch({args: ['--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><title>Texture upload benchmark</title>');
  await page.addScriptTag({content: bundle.outputFiles[0].text});
  await page.evaluate(async () => {await globalThis.benchmarkReady;});
  const client = await page.context().newCDPSession(page);
  const results = [];
  for (const matching of [true, false]) {
    await page.evaluate(async matching => (await globalThis.benchmarkReady).configure(matching), matching);
    await page.evaluate(async writes => (await globalThis.benchmarkReady).run(10, writes, false), writesPerBatch);
    // Include collected objects: retained heap size alone misses short-lived allocation churn.
    await client.send('HeapProfiler.startSampling', {
      samplingInterval: 16384,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true
    });
    const timing = await page.evaluate(async ({batchCount, writesPerBatch}) =>
      (await globalThis.benchmarkReady).run(batchCount, writesPerBatch, true),
      {batchCount, writesPerBatch});
    const {profile} = await client.send('HeapProfiler.stopSampling');
    const names = new Map();
    const visit = node => {
      names.set(node.id, node.callFrame.functionName || '(anonymous)');
      for (const child of node.children) visit(child);
    };
    visit(profile.head);
    const allocationByFunction = new Map();
    let sampledAllocationBytes = 0;
    for (const sample of profile.samples) {
      sampledAllocationBytes += sample.size;
      const name = names.get(sample.nodeId);
      allocationByFunction.set(name, (allocationByFunction.get(name) || 0) + sample.size);
    }
    results.push({
      mode: matching ? 'matching unpack state' : 'different unpack state',
      ...timing,
      sampledAllocationBytes,
      topAllocators: [...allocationByFunction].sort((left, right) => right[1] - left[1]).slice(0, 10)
    });
  }
  await page.evaluate(async () => (await globalThis.benchmarkReady).destroy());
  console.log(JSON.stringify({root, browser: browser.version(), writesPerBatch, batchCount, results}, null, 2));
} finally {
  await browser.close();
}
