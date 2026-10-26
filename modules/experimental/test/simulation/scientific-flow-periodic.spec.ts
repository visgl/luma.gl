// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {ScientificFlowGraph, ScientificFlowTracer} from '@luma.gl/experimental';
import {getTestDevice} from '@luma.gl/test-utils';

function makeUniformField(speed: number) {
  return {
    dimensions: ['y', 'x'] as const,
    shape: [2, 2] as const,
    eastward: new Float32Array(4).fill(speed),
    northward: new Float32Array(4),
    valid: new Uint8Array(4).fill(1)
  };
}

for (const integrator of ['rk2', 'rk4', 'rk45'] as const) {
  for (const direction of [-1, 1]) {
    it(`${integrator} wraps longitude without respawn or stopping, including after snapshot rotation (${direction})`, async context => {
      const device = await getTestDevice('webgpu');
      if (!device) return context.skip();
      const initialLongitude = direction > 0 ? 0.99 : 0.01;
      const input = makeUniformField(direction * 0.2);
      const props = {
        input,
        nextInput: input,
        timeRange: [0, 1] as const,
        bounds: [0, 0, 1, 1] as const,
        periodicLongitude: true
      };
      const simulation =
        integrator === 'rk45'
          ? new ScientificFlowTracer(device, {
              ...props,
              positions: new Float32Array([initialLongitude, 0.5]),
              tolerance: 1e-5,
              maximumTimeStep: 0.1,
              maximumAttempts: 1
            })
          : new ScientificFlowGraph(device, {...props, integrator, particleCount: 1});
      try {
        simulation.output.write(new Float32Array([initialLongitude, 0.5, 0, 1]));
        for (let interval = 0; interval < 2; interval++) {
          if (interval) simulation.setNextSnapshot(input, 2);
          if (simulation instanceof ScientificFlowTracer) {
            let result = await simulation.advance(1);
            expect(result.complete).toBe(false);
            for (let dispatch = 0; !result.complete && dispatch < 20; dispatch++)
              result = await simulation.continue();
            expect(result.complete).toBe(true);
            expect(result.active).toBe(1);
            expect(result.outsideDomain).toBe(0);
          } else simulation.advance(1);
        }
        const bytes = await simulation.output.readAsync();
        const particle = new Float32Array(bytes.buffer, bytes.byteOffset, 4);
        expect(particle[0]).toBeCloseTo(direction > 0 ? 0.39 : 0.61, 5);
        expect(particle[1]).toBeCloseTo(0.5, 6);
        expect(particle[2]).toBeCloseTo(2, 5);
        expect(particle[3]).toBe(1);
      } finally {
        simulation.destroy();
      }
    });
  }
}

it('periodic longitude preserves geographic scaling and latitude boundaries', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: makeUniformField(111195.08),
    bounds: [-180, -60, 180, 60],
    coordinates: 'lnglat',
    periodicLongitude: true,
    positions: new Float32Array([0.999, 0.5, 0.5, 1.1]),
    tolerance: 1,
    maximumTimeStep: 1
  });
  try {
    const result = await tracer.advance(10);
    expect(result.complete).toBe(true);
    expect(result.active).toBe(1);
    expect(result.outsideDomain).toBe(1);
    const bytes = await tracer.output.readAsync();
    const particle = new Float32Array(bytes.buffer, bytes.byteOffset);
    expect(particle[0]).toBeCloseTo(0.999 + 10 / 360 - 1, 5);
  } finally {
    tracer.destroy();
  }
});
