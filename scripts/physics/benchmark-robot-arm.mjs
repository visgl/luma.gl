// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

/** Run from the repo root against the Rigid Body Lab's Vite server. */
const url = new URL(process.argv[2] ?? 'http://127.0.0.1:5312/');
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Expected a local lab URL');
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'})
);
try {
  const page = await browser.newPage();
  await page.route('**/main.ts*', route =>
    route.fulfill({contentType: 'text/javascript', body: ''})
  );
  await page.goto(url.href);
  const report = await page.evaluate(async root => {
    const [
      {luma},
      {webgpuAdapter},
      {GPUCommandGraph},
      {GPURigidBodyWorld},
      {makeRobotArm, measureRobotArm, ARM_STIFFNESS, ARM_JOINT_NAMES}
    ] = await Promise.all([
      import(root + '/modules/core/src/index.ts'),
      import(root + '/modules/core/src/webgpu/index.ts'),
      import(root + '/modules/graph/src/gpu-core/gpu-command-graph.ts'),
      import(root + '/modules/graph/src/gpu-physics/gpu-rigid-body-world.ts'),
      import('/robot-arm.ts')
    ]);
    const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
    const rows = [];
    try {
      for (const links of [1, 4])
        for (const payload of [0.5, 3])
          for (const frequency of [60, 120])
            for (const iterations of [8, 32, 64]) {
              const {bodies, joints} = makeRobotArm(payload, links, false);
              const world = new GPURigidBodyWorld({
                bodies,
                joints,
                solver: 'ordered',
                gravity: [0, 0, -9.81],
                iterations,
                timeStep: 1 / frequency
              });
              const definition = new GPUCommandGraph(device);
              let graph;
              try {
                world.addToGraph(definition);
                graph = await definition.compileAsync();
                // At horizontal, each link weighs 1 kg with its center halfway along the link.
                // Preload the springs by exactly the static gravitational moment divided by stiffness.
                for (let index = 0; index < links; index++) {
                  const length = links - index;
                  const moment = 9.81 * (payload * length + (length * length) / 2);
                  world.setAngularActuator(ARM_JOINT_NAMES[index], 1, {
                    angle: -moment / ARM_STIFFNESS,
                    maximumTorque: 300
                  });
                }
                const encode = steps => {
                  const encoder = device.createCommandEncoder();
                  for (let step = 0; step < steps; step++)
                    graph.encode(encoder, {parameters: undefined});
                  device.submit(encoder.finish());
                };
                for (let second = 0; second < 6; second++) {
                  encode(frequency);
                  await world.readSimulationDiagnostics();
                }
                await world.readSimulationDiagnostics();
                const times = [];
                let maximumTipError = 0,
                  maximumTorqueError = 0,
                  maximumAnchorDrift = 0;
                for (let sample = 0; sample < 30; sample++) {
                  const start = performance.now();
                  encode(1);
                  const fence = device.createFence();
                  try {
                    await fence.signaled;
                  } finally {
                    fence.destroy();
                  }
                  times.push(performance.now() - start);
                  const [states, torque] = await Promise.all([
                    world.readState(),
                    world.readAngularActuatorTorque('shoulder', 1)
                  ]);
                  const expectedTorque = 9.81 * (payload * links + (links * links) / 2);
                  maximumTorqueError = Math.max(
                    maximumTorqueError,
                    Math.abs(torque + expectedTorque) / expectedTorque
                  );
                  maximumTipError = Math.max(
                    maximumTipError,
                    measureRobotArm(states, links, 0).tipError
                  );
                  let previous = [0, 0, 2];
                  for (const body of states.slice(2, 2 + links)) {
                    const [x, y, z, w] = body.orientation;
                    const offset = [0.5 - y * y - z * z, x * y + w * z, x * z - w * y];
                    maximumAnchorDrift = Math.max(
                      maximumAnchorDrift,
                      Math.hypot(
                        ...body.position.map((value, axis) => value - offset[axis] - previous[axis])
                      )
                    );
                    previous = body.position.map((value, axis) => value + offset[axis]);
                  }
                }
                times.sort((a, b) => a - b);
                const diagnostics = await world.readSimulationDiagnostics();
                const qualified =
                  diagnostics.complete &&
                  diagnostics.steps === 6 * frequency + 30 &&
                  maximumTipError <= 0.04 &&
                  maximumAnchorDrift <= 0.01 &&
                  maximumTorqueError <= 0.1;
                rows.push({
                  links,
                  payload,
                  frequency,
                  iterations,
                  qualified,
                  maximumTipError,
                  maximumAnchorDrift,
                  maximumTorqueError,
                  p50: times[14],
                  p95: times[28]
                });
              } finally {
                graph?.destroy();
                world.destroy();
              }
            }
      return {adapter: device.info, rows};
    } finally {
      device.destroy();
    }
  }, '/@fs' + process.cwd());
  console.log(JSON.stringify({browser: browser.version(), ...report}, null, 2));
} finally {
  await browser.close();
}
