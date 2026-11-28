// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  makeGantry,
  gantryTargets,
  GANTRY_WEIGHT
} from '../../../../examples/experimental/gpu-rigid-body-world/gantry';

it.for([
  false,
  true
])('shares beam reactions across two roots with reversed registration %s', async (reverse, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const trial = makeGantry({parts: 64, reverse});
  const definition = new GPUCommandGraph(device);
  trial.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    expect(graph.stats.nodeOrder.filter(id => id.endsWith('-gather-boxes'))).toHaveLength(1);
    for (let step = 0; step < 192; step += 4) {
      const target = gantryTargets(step);
      trial.command(target.height, target.travel);
      const encoder = device.createCommandEncoder();
      for (let substep = 0; substep < 4; substep++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    }
    const hold = await trial.read();
    expect(hold.complete).toBe(true);
    expect(hold.rows).toBe(8);
    expect(hold.reused).toBe(8);
    expect(hold.position[2]).toBeCloseTo(0.96, 2);
    expect(hold.loads![0] + hold.loads![1]).toBeCloseTo(GANTRY_WEIGHT, 1);
    expect(hold.loads![1]).toBeGreaterThan(hold.loads![0]);
  } finally {
    graph.destroy();
    trial.destroy();
  }
});
