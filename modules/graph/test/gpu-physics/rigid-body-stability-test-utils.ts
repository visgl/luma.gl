// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {waitForSubmittedPhysicsWork} from './physics-test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

export async function runRigidBodyWorld(properties: GPURigidBodyWorldProps, steps: number) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld(properties);
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let start = 0; start < steps; start += 20) {
      const encoder = device.createCommandEncoder();
      for (let step = start; step < Math.min(start + 20, steps); step++)
        graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await waitForSubmittedPhysicsWork(device);
    }
    const diagnostics = await world.readSimulationDiagnostics();
    expect(diagnostics).toMatchObject({steps, complete: true, incompleteSteps: 0});
    return await world.readState();
  } finally {
    graph.destroy();
    world.destroy();
  }
}
