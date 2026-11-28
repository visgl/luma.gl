// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:5342/');
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Expected local lab');
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'})
);
try {
  const page = await browser.newPage();
  await page.route(url.href, route =>
    route.fulfill({body: '<title>Gantry benchmark</title>', contentType: 'text/html'})
  );
  page.on('console', m => {
    if (m.type() === 'error') console.error(m.text());
  });
  await page.goto(url.href);
  const report = await page.evaluate(
    async ({root, parts, ordered, reverse, faceManifold}) => {
      const [{luma}, {webgpuAdapter}, {GPUCommandGraph}, {makeGantry, gantryTargets}] =
        await Promise.all([
          import(root + '/modules/core/src/index.ts'),
          import(root + '/modules/core/src/webgpu/index.ts'),
          import(root + '/modules/graph/src/gpu-core/gpu-command-graph.ts'),
          import('/gantry.ts')
        ]);
      const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
      const trial = makeGantry({parts, ordered, reverse, faceManifold});
      const definition = new GPUCommandGraph(device);
      trial.addToGraph(definition);
      const graph = await definition.compileAsync();
      try {
        const measurements = [],
          snapshots = [];
        for (let step = 0; step < 512; step++) {
          const start = performance.now();
          if (step % 4 === 0) {
            const {height, travel} = gantryTargets(step);
            trial.command(height, travel);
          }
          const encoder = device.createCommandEncoder();
          graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const fence = device.createFence();
          try {
            await fence.signaled;
          } finally {
            fence.destroy();
          }
          if (step >= 20) measurements.push(performance.now() - start);
          if ([19, 159, 191, 355, 511].includes(step))
            snapshots.push({
              step,
              ...(await trial.read(
                step === 159 || step === 191 ? gantryTargets(step).height : undefined
              ))
            });
        }
        measurements.sort((a, b) => a - b);
        const hold = snapshots[2],
          end = snapshots.at(-1);
        const carried = snapshots[3];
        const qualified =
          Math.abs(hold.loads[0] + hold.loads[1] - 39.24) < 3 &&
          hold.loads[1] > hold.loads[0] &&
          Math.abs(carried.position[2] - 0.96) < 0.06 &&
          snapshots.every(s => s.complete) &&
          Math.abs(hold.position[2] - 0.96) < 0.06 &&
          Math.abs(end.position[1] - 0.4) < 0.06 &&
          Math.abs(end.position[2] - 0.47) < 0.03;
        return {
          device: device.info,
          parts,
          ordered,
          reverse,
          faceManifold,
          qualified,
          snapshots,
          samples: measurements.length,
          p50: measurements[Math.floor(measurements.length * 0.5)],
          p95: measurements[Math.floor(measurements.length * 0.95)]
        };
      } finally {
        graph.destroy();
        trial.destroy();
        device.destroy();
      }
    },
    {
      root: '/@fs' + process.cwd(),
      parts: process.argv.includes('--256') ? 256 : 64,
      ordered: process.argv.includes('--ordered'),
      reverse: process.argv.includes('--reverse'),
      faceManifold: !process.argv.includes('--single')
    }
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.qualified) process.exitCode = 2;
} finally {
  await browser.close();
}
