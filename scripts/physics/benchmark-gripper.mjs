// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:5327/');
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Expected local lab');
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'})
);
try {
  const page = await browser.newPage();
  await page.route(url.href, route =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Gripper benchmark</title>'
    })
  );
  await page.goto(url.href);
  page.on('console', message => {
    if (message.type() === 'error') console.error(message.text());
  });
  const report = await page.evaluate(
    async ({root, bin, parts, reducedOnly}) => {
      const [{luma}, {webgpuAdapter}, {GPUCommandGraph}, {makeGripperTrial}] = await Promise.all([
        import(root + '/modules/core/src/index.ts'),
        import(root + '/modules/core/src/webgpu/index.ts'),
        import(root + '/modules/graph/src/gpu-core/gpu-command-graph.ts'),
        import('/gripper.ts')
      ]);
      const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
      const rows = [];
      try {
        for (const reduced of parts === 256 || reducedOnly ? [true] : [true, false])
          for (const scenario of parts
            ? [{target: 1, parts}]
            : bin
              ? [
                  {target: 1},
                  {target: 0, offset: 0.035},
                  {target: 1, obstructed: true},
                  {target: 1, drop: true}
                ]
              : [undefined])
            for (const friction of parts ||
            scenario?.obstructed ||
            scenario?.offset ||
            scenario?.drop
              ? [0.9]
              : [0.9, 0]) {
              const trial = makeGripperTrial(reduced, friction, false, {bin: scenario});
              const definition = new GPUCommandGraph(device);
              trial.addToGraph(definition);
              const graph = await definition.compileAsync();
              try {
                const times = [],
                  phases = [],
                  neighbors = [],
                  contactMasks = [];
                let steps = 0;
                let initialPositions;
                let neighborDisplacement = 0;
                let maximumCandidates = 0;
                let maximumContacts = 0;
                let maximumReused = 0;
                let greatestSlip = 0,
                  deepestOverlap = 0,
                  gripOffset;
                for (let phase = 0; phase < trial.phaseNames.length; phase++) {
                  trial.command(phase);
                  for (let step = 0; step < trial.travelSteps(phase) + 60; step++) {
                    const start = performance.now();
                    if (step <= trial.travelSteps(phase) && step % 4 === 0)
                      trial.command(phase, step);
                    const encoder = device.createCommandEncoder();
                    graph.encode(encoder, {parameters: undefined});
                    device.submit(encoder.finish());
                    const fence = device.createFence();
                    try {
                      await fence.signaled;
                    } finally {
                      fence.destroy();
                    }
                    steps++;
                    if (phase > 0 && phase < 6) times.push(performance.now() - start);
                    const phaseEnd = step === trial.travelSteps(phase) + 59;
                    if (step % 12 === 11 || phaseEnd) {
                      const states = (await trial.world.readState()).slice(reduced ? 0 : 2);
                      if (trial.binWorld)
                        states.push(...(await trial.binWorld.readState()).slice(1));
                      const bodyIndex = 4 + (scenario?.target ?? 0);
                      const positions = states.map(state => state.position);
                      if (parts) {
                        const stock = positions.slice(4, 4 + parts);
                        initialPositions ??= stock;
                        stock.forEach((position, index) => {
                          if (index !== scenario.target)
                            neighborDisplacement = Math.max(
                              neighborDisplacement,
                              Math.hypot(...position.map((v, i) => v - initialPositions[index][i]))
                            );
                        });
                        if (reduced) {
                          const diagnostics = await trial.world.readSimulationDiagnostics();
                          maximumCandidates = Math.max(
                            maximumCandidates,
                            diagnostics.candidatePairs
                          );
                          maximumContacts = Math.max(maximumContacts, diagnostics.activeContacts);
                          maximumReused = Math.max(maximumReused, diagnostics.reusedContacts);
                        }
                      }
                      const [left, right] = positions.slice(2);
                      const box = positions[bodyIndex];
                      const distance = Math.hypot(
                        ...box.map((v, i) => v - (left[i] + right[i]) / 2)
                      );
                      if (phase === 1) gripOffset = distance;
                      if (phase === 2 || phase === 3)
                        greatestSlip = Math.max(greatestSlip, Math.abs(distance - gripOffset));
                      const [qx, qy, qz, qw] = states[bodyIndex].orientation;
                      // World Z projection of the three oriented half-extent vectors.
                      const verticalExtent =
                        0.19 * Math.abs(2 * (qx * qz - qw * qy)) +
                        0.2 * Math.abs(2 * (qy * qz + qw * qx)) +
                        0.24 * Math.abs(1 - 2 * (qx * qx + qy * qy));
                      deepestOverlap = Math.max(deepestOverlap, verticalExtent - box[2]);
                      if (phaseEnd) {
                        phases.push(box);
                        if (scenario) {
                          neighbors.push(positions.slice(4, 7));
                          if (reduced)
                            contactMasks.push(
                              (await trial.world.readSimulationDiagnostics()).padContactMasks
                            );
                        }
                      }
                    }
                  }
                }
                const status = await trial.world.readSimulationDiagnostics();
                times.sort((a, b) => a - b);
                const end = phases[5];
                const landingError = Math.hypot(
                  end[0] - 1.4 * Math.cos(bin ? 1.65 : 1),
                  end[1] - 1.4 * Math.sin(bin ? 1.65 : 1)
                );
                const counterpart = await trial.binWorld?.readSimulationDiagnostics();
                rows.push({
                  scenario: scenario ?? 'reference',
                  ...(parts
                    ? {neighborDisplacement, maximumCandidates, maximumContacts, maximumReused}
                    : {}),
                  counterpart,
                  neighbors,
                  contactMasks,
                  steps,
                  solver: reduced ? 'reduced' : 'ordered',
                  friction,
                  samples: times.length,
                  p50: times[Math.ceil(times.length * 0.5) - 1],
                  p95: times[Math.ceil(times.length * 0.95) - 1],
                  phases,
                  maximumRadialSlip: greatestSlip,
                  maximumBenchPenetration: deepestOverlap,
                  landingError,
                  qualified:
                    status.complete &&
                    status.steps === steps &&
                    (!counterpart || (counterpart.complete && counterpart.steps === steps)) &&
                    (scenario?.obstructed
                      ? !reduced ||
                        ((contactMasks[1][0] & 2) !== 0 && (contactMasks[1][1] & 4) !== 0)
                      : scenario?.drop
                        ? phases[2][2] > 0.58 &&
                          phases[5][2] < phases[3][2] - 0.1 &&
                          phases[5][2] > 0.1
                        : friction
                          ? greatestSlip < 0.05 &&
                            phases[2][2] > 0.58 &&
                            phases[3][2] > 0.58 &&
                            landingError < 0.25 &&
                            Math.abs(end[2] - 0.24) < 0.06
                          : phases[2][2] < 0.32)
                });
              } finally {
                graph.destroy();
                trial.world.destroy();
                trial.binWorld?.destroy();
              }
            }
        return {adapter: device.info, rows};
      } finally {
        device.destroy();
      }
    },
    {
      root: '/@fs' + process.cwd(),
      bin:
        process.argv.includes('--bin') ||
        process.argv.includes('--crowded') ||
        process.argv.includes('--scale'),
      reducedOnly: process.argv.includes('--reduced'),
      parts: process.argv.includes('--scale') ? 256 : process.argv.includes('--crowded') ? 64 : 0
    }
  );
  console.log(JSON.stringify({browser: browser.version(), ...report}, null, 2));
  if (report.rows.some(row => !row.qualified)) process.exitCode = 2;
} finally {
  await browser.close();
}
