// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'})
);
try {
  const context = await browser.newContext();
  await context.route('**/@vite/client', route =>
    route.fulfill({contentType: 'text/javascript', body: ''})
  );
  await context.route('**/main.ts*', route =>
    route.fulfill({contentType: 'text/javascript', body: ''})
  );
  const page = await context.newPage();
  await page.goto(process.env.PHYSICS_MECHANISMS_URL || 'http://127.0.0.1:5233/');
  const report = await page.evaluate(async rootPath => {
    const root = rootPath;
    const [{luma}, {webgpuAdapter}, {GPUCommandGraph}, {GPURigidBodyWorld}, {makeMechanism}] =
      await Promise.all([
        import(`${root}/modules/core/src/index.ts`),
        import(`${root}/modules/core/src/webgpu/index.ts`),
        import(`${root}/modules/gpgpu/src/gpu-core/gpu-command-graph.ts`),
        import(`${root}/modules/gpgpu/src/gpu-physics/gpu-rigid-body-world.ts`),
        import(`${root}/examples/experimental/gpu-rigid-body-world/mechanisms.ts`)
      ]);
    const device = await luma.createDevice({adapters: [webgpuAdapter]});
    const world = new GPURigidBodyWorld({
      ...makeMechanism('cradle'),
      solver: 'ordered',
      iterations: 8,
      failurePolicy: 'rollback',
      timeStep: 1 / 480,
      restitutionThreshold: 0,
      broadPhase: 'all-pairs',
      gravity: [0, 0, -9.81]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    const samples = [];
    for (let batch = 0; batch < 60; batch++) {
      const encoder = device.createCommandEncoder();
      for (let step = 0; step < 480; step++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const state = await world.readState();
      const balls = [2, 4, 6, 8, 10].map(index => state[index]);
      samples.push({
        second: batch + 1,
        balls: balls.map(ball => ({position: ball.position, velocity: ball.velocity})),
        lengths: balls.map((ball, index) =>
          Math.hypot(
            ...ball.position.map((value, axis) => value - state[index * 2 + 1].position[axis])
          )
        )
      });
    }
    const diagnostics = await world.readSimulationDiagnostics();
    graph.destroy();
    world.destroy();
    device.destroy();
    return {samples, diagnostics};
  }, `/@fs${process.cwd()}`);
  const maximumJointError = Math.max(
    ...report.samples.flatMap(sample => sample.lengths.map(length => Math.abs(length - 2.5)))
  );
  const maximumMiddleDisplacement = Math.max(
    ...report.samples.flatMap(sample =>
      sample.balls.slice(1, 4).map((ball, index) => Math.abs(ball.position[0] - (index - 1) * 0.81))
    )
  );
  const finalEndAmplitude = Math.max(
    ...report.samples
      .slice(-10)
      .flatMap(sample => [
        Math.abs(sample.balls[0].position[0] + 1.62),
        Math.abs(sample.balls[4].position[0] - 1.62)
      ])
  );
  const endMotionRanges = [0, 4].map(index => {
    const positions = report.samples.slice(-10).map(sample => sample.balls[index].position[0]);
    return Math.max(...positions) - Math.min(...positions);
  });
  const initialEnergy = 9.81 * 2.5 * (1 - Math.cos(0.65));
  const energyRatios = report.samples.map(
    sample =>
      sample.balls.reduce(
        (total, ball) =>
          total +
          9.81 * (ball.position[2] - 1.5) +
          ball.velocity.reduce((total, component) => total + component * component, 0) / 2,
        0
      ) / initialEnergy
  );
  console.log(
    JSON.stringify(
      {
        maximumJointError,
        maximumMiddleDisplacement,
        finalEndAmplitude,
        endMotionRanges,
        minimumEnergyRatio: Math.min(...energyRatios),
        maximumEnergyRatio: Math.max(...energyRatios),
        diagnostics: report.diagnostics
      },
      null,
      2
    )
  );
  assert.ok(report.diagnostics.complete && report.diagnostics.incompleteSteps === 0);
  assert.ok(
    maximumJointError < 0.001,
    'Tethers must retain their lengths over 60 simulated seconds'
  );
  assert.ok(
    maximumMiddleDisplacement < 0.35,
    'The middle balls must remain close to the resting row'
  );
  assert.ok(
    finalEndAmplitude > 1.2,
    'End-to-end swings must persist through the final ten seconds'
  );
  assert.ok(
    endMotionRanges.every(range => range > 1),
    'Both end balls must keep moving in the final ten seconds'
  );
  assert.ok(
    Math.min(...energyRatios) > 0.9 && Math.max(...energyRatios) < 1.1,
    'Energy must remain bounded'
  );
} finally {
  await browser.close();
}
