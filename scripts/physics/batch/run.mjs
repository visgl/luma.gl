// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {parseArgs} from 'node:util';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../../playwright/get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {
  url: {type: 'string', default: 'http://127.0.0.1:5244'},
  cases: {type: 'string', default: '1x128,8x128,1x1024,8x1024'},
  frames: {type: 'string', default: '120'},
  repeats: {type: 'string', default: '3'},
  scene: {type: 'string', default: 'sparse'},
  output: {type: 'string', default: '/tmp/physics-batch-report.json'}
}});
const root = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/, '');
const cases = values.cases.split(',').map(value => {
  if (!/^\d+x\d+$/.test(value)) throw new Error('Cases must be worldsxbodies');
  const [worlds, bodies] = value.split('x').map(Number);
  return {worlds, bodies};
});
const frames = Number(values.frames), repeats = Number(values.repeats);
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10 || !['sparse', 'pile'].includes(values.scene)) throw new Error('Invalid repetitions or scene');
const browser = await chromium.launch(getPlaywrightLaunchOptions({backend: 'webgpu', headless: true}));
const results = [];
try {
  const page = await browser.newPage();
  // Avoid running the interactive example while collecting timings.
  await page.route('**/benchmark-shell', route => route.fulfill({contentType: 'text/html', body: '<html><body>Physics batch qualification</body></html>'}));
  await page.goto(`${values.url}/benchmark-shell`);
  for (let repeat = 0; repeat < repeats; repeat++) {
    for (const dimensions of cases) {
      for (const submission of repeat % 2 ? ['separate', 'batched'] : ['batched', 'separate']) {
        const result = await page.evaluate(async ({root, options}) => {
          const [{luma}, {webgpuAdapter}, {runBatchBenchmark}] = await Promise.all([
            import(`${root}/modules/core/src/index.ts`),
            import(`${root}/modules/core/src/webgpu/index.ts`),
            import(`${root}/examples/experimental/physics-stress/batch-benchmark.ts`)
          ]);
          const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter]});
          try { return await runBatchBenchmark(device, options); }
          finally { device.destroy(); }
        }, {root: `/@fs${root}`, options: {...dimensions, frames, warmup: 10, steps: 1, scene: values.scene, submission}});
        // Final sampled states are available in the interactive export; keep suite reports compact.
        delete result.states;
        results.push({repeat, ...result});
        writeFileSync(values.output, JSON.stringify({browser: browser.version(), results}, null, 2));
        console.log(`${repeat} ${dimensions.worlds}x${dimensions.bodies} ${submission}: p95=${result.latencyMilliseconds.p95.toFixed(2)}ms body-steps/s=${result.bodyStepsPerSecond?.toFixed(0)} complete=${result.complete}`);
      }
    }
  }
} finally { await browser.close(); }
