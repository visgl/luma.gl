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
  const report = await page.evaluate(
    async ({root, compare}) => {
      const [
        {luma},
        {webgpuAdapter},
        {GPUCommandGraph},
        {GPURigidBodyWorld},
        {GPUArticulationTree, getBodyInertia},
        {makeRobotArm, measureRobotArm, ARM_STIFFNESS, ARM_JOINT_NAMES}
      ] = await Promise.all([
        import(root + '/modules/core/src/index.ts'),
        import(root + '/modules/core/src/webgpu/index.ts'),
        import(root + '/modules/graph/src/gpu-core/gpu-command-graph.ts'),
        import(root + '/modules/graph/src/gpu-physics/gpu-rigid-body-world.ts'),
        import(root + '/modules/graph/src/gpu-physics/index.ts'),
        import('/robot-arm.ts')
      ]);
      const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
      const rows = [];
      try {
        for (const links of compare ? [4] : [1, 4])
          for (const payload of compare ? [3] : [0.5, 3])
            for (const frequency of compare ? [120] : [60, 120])
              for (const iterations of compare ? [64, 0] : [8, 32, 64]) {
                const reduced = iterations === 0;
                const {bodies, joints} = makeRobotArm(payload, links, false);
                // The ordered fixture's floor and support are static. Only moving bodies carry inertia.
                const world = reduced
                  ? new GPUArticulationTree({
                      base: bodies[1].position,
                      timeStep: 1 / frequency,
                      links: bodies.slice(2).map((body, index) => {
                        const attachment = joints.find(joint => joint.second === index + 2);
                        return {
                          id: attachment.id ?? 'payload',
                          parent: attachment.first - 2,
                          parentAnchor: attachment.firstFrame.position,
                          childAnchor: attachment.secondFrame?.position ?? [0, 0, 0],
                          axis: attachment.type === 'fixed' ? undefined : [0, 1, 0],
                          mass: body.mass,
                          inertia: getBodyInertia(body.mass, body.shape)
                        };
                      })
                    })
                  : new GPURigidBodyWorld({
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
                    if (reduced)
                      world.setDrive(ARM_JOINT_NAMES[index], {
                        angle: -moment / ARM_STIFFNESS,
                        stiffness: ARM_STIFFNESS,
                        damping: 70,
                        maximumTorque: 300
                      });
                    else
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
                  const samples = compare ? 240 : 30;
                  const times = [];
                  let originalWindow;
                  let maximumTipError = 0,
                    maximumTorqueError = 0,
                    maximumAnchorDrift = 0;
                  for (let sample = 0; sample < samples; sample++) {
                    const start = performance.now();
                    encode(1);
                    const fence = device.createFence();
                    try {
                      await fence.signaled;
                    } finally {
                      fence.destroy();
                    }
                    times.push(performance.now() - start);
                    const [movingStates, torque] = await Promise.all([
                      world.readState(),
                      reduced
                        ? world.readTorque('shoulder')
                        : world.readAngularActuatorTorque('shoulder', 1)
                    ]);
                    const states = reduced ? [null, null, ...movingStates] : movingStates;
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
                          ...body.position.map(
                            (value, axis) => value - offset[axis] - previous[axis]
                          )
                        )
                      );
                      previous = body.position.map((value, axis) => value + offset[axis]);
                    }
                    if (sample === 29) {
                      const sorted = [...times].sort((a, b) => a - b);
                      originalWindow = {
                        maximumTipError,
                        maximumAnchorDrift,
                        maximumTorqueError,
                        p50: sorted[14],
                        p95: sorted[28],
                        qualified:
                          maximumTipError <= 0.04 &&
                          maximumAnchorDrift <= 0.01 &&
                          maximumTorqueError <= 0.1
                      };
                    }
                  }
                  times.sort((a, b) => a - b);
                  const diagnostics = await world.readSimulationDiagnostics();
                  const qualified =
                    diagnostics.complete &&
                    diagnostics.steps === 6 * frequency + samples &&
                    maximumTipError <= 0.04 &&
                    maximumAnchorDrift <= 0.01 &&
                    maximumTorqueError <= 0.1;
                  // A separate target step checks that a quick equilibrium kernel also moves the payload.
                  // These samples include state reads and are deliberately excluded from latency.
                  let motion;
                  if (compare) {
                    const command = -0.24;
                    for (let index = 0; index < links; index++) {
                      const length = links - index;
                      const momentArm = payload * length + (length * length) / 2;
                      const horizontal = index === 0 ? payload + links - 0.5 : 0;
                      const moment =
                        9.81 * (horizontal + (momentArm - horizontal) * Math.cos(command));
                      const angle = (index === 1 ? command : 0) - moment / ARM_STIFFNESS;
                      if (reduced)
                        world.setDrive(ARM_JOINT_NAMES[index], {
                          angle,
                          stiffness: ARM_STIFFNESS,
                          damping: 70,
                          maximumTorque: 300
                        });
                      else
                        world.setAngularActuator(ARM_JOINT_NAMES[index], 1, {
                          angle,
                          maximumTorque: 300
                        });
                    }
                    let peakAngle = 0;
                    for (let interval = 0; interval < 24; interval++) {
                      encode(10);
                      const result = await world.readState();
                      const reading = measureRobotArm(
                        reduced ? [null, null, ...result] : result,
                        links,
                        command
                      );
                      peakAngle = Math.max(peakAngle, Math.abs(reading.angle));
                      motion = {
                        peakAngle,
                        finalElbowAngle: reading.angle,
                        finalTipError: reading.tipError
                      };
                    }
                  }
                  rows.push({
                    links,
                    payload,
                    frequency,
                    solver: reduced ? 'reduced-coordinate' : 'ordered',
                    iterations: reduced ? null : iterations,
                    qualified,
                    ...(compare ? {originalWindow} : {}),
                    maximumTipError,
                    maximumAnchorDrift,
                    maximumTorqueError,
                    samples,
                    motion,
                    p50: times[Math.ceil(samples * 0.5) - 1],
                    p95: times[Math.ceil(samples * 0.95) - 1]
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
    },
    {root: '/@fs' + process.cwd(), compare: process.argv.includes('--compare-tree')}
  );
  if (
    process.argv.includes('--compare-tree') &&
    report.rows.some(
      row =>
        !row.originalWindow.qualified ||
        (row.solver === 'reduced-coordinate' && !row.qualified) ||
        !(row.motion.peakAngle > 0.1)
    )
  )
    process.exitCode = 2;
  console.log(JSON.stringify({browser: browser.version(), ...report}, null, 2));
} finally {
  await browser.close();
}
