// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {ScientificFlowGraph} from '@luma.gl/experimental';
import {getTestDevice} from '@luma.gl/test-utils';

for (const integrator of ['rk2', 'rk4'] as const) {
  it(`ScientificFlowGraph ${integrator} integrates an analytic rotation on WebGPU`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const width = 32;
    const eastward = new Float32Array(width * width);
    const northward = new Float32Array(width * width);
    for (let row = 0; row < width; row++) {
      for (let column = 0; column < width; column++) {
        eastward[row * width + column] = -(row / (width - 1) - 0.5);
        northward[row * width + column] = column / (width - 1) - 0.5;
      }
    }
    const graph = new ScientificFlowGraph(device, {
      input: {
        dimensions: ['y', 'x'],
        shape: [width, width],
        eastward,
        northward,
        valid: new Uint8Array(width * width).fill(1)
      },
      bounds: [0, 0, 1, 1],
      particleCount: 129,
      lifetime: 10,
      integrator
    });
    try {
      const initial = new Float32Array(129 * 4);
      for (let index = 0; index < 129; index++) initial.set([0.75, 0.5, 0, 3], index * 4);
      graph.output.write(initial);
      const first = graph.output;
      for (let index = 0; index < 30; index++) graph.step(1 / 30);
      const result = new Float32Array((await graph.output.readAsync()).buffer);
      for (const index of [0, 128]) {
        expect(result[index * 4]).toBeCloseTo(
          0.5 + 0.25 * Math.cos(1),
          integrator === 'rk4' ? 5 : 4
        );
        expect(result[index * 4 + 1]).toBeCloseTo(
          0.5 + 0.25 * Math.sin(1),
          integrator === 'rk4' ? 5 : 4
        );
        expect(result[index * 4 + 2]).toBeCloseTo(1, 5);
        expect(result[index * 4 + 3]).toBe(3);
      }
      expect(graph.output).toBe(first);
      expect(() => graph.step(Number.NaN)).toThrow();
      expect(() => graph.step(1)).toThrow();
    } finally {
      graph.destroy();
    }
  });
}

it('ScientificFlowGraph preserves missing-data masks and deterministic respawns', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const input = {
    dimensions: ['y', 'x'] as const,
    shape: [2, 2] as const,
    eastward: new Float32Array([NaN, NaN, NaN, NaN]),
    northward: new Float32Array(4),
    valid: new Uint8Array(4)
  };
  const first = new ScientificFlowGraph(device, {
    input,
    bounds: [0, 0, 1, 1],
    particleCount: 129,
    seed: 42
  });
  const second = new ScientificFlowGraph(device, {
    input,
    bounds: [0, 0, 1, 1],
    particleCount: 129,
    seed: 42
  });
  try {
    first.step(1 / 60);
    second.step(1 / 60);
    const bytes = await first.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, 129 * 4);
    expect(await second.output.readAsync()).toEqual(bytes);
    for (let index = 0; index < 129; index++) {
      expect(values[index * 4]).toBeGreaterThanOrEqual(0);
      expect(values[index * 4]).toBeLessThan(1);
      expect(values[index * 4 + 2]).toBe(-1);
      expect(values[index * 4 + 3]).toBe(1);
    }
  } finally {
    first.destroy();
    second.destroy();
  }
});

it('ScientificFlowGraph converts geographic metres/second to angular displacement', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const graph = new ScientificFlowGraph(device, {
    input: {
      dimensions: ['latitude', 'longitude'],
      shape: [2, 2],
      eastward: new Float32Array(4).fill(111195.08),
      northward: new Float32Array(4),
      valid: new Uint8Array(4).fill(1),
      geographic: {longitudeStart: 0, latitudeStart: 59, longitudeStep: 10, latitudeStep: 2}
    },
    particleCount: 1
  });
  try {
    graph.output.write(new Float32Array([0.5, 0.5, 1, 2]));
    graph.step(1 / 30);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, 4);
    expect(values[0]).toBeCloseTo(0.5 + 2 / 300, 5);
    expect(values[1]).toBe(0.5);
    expect(values[3]).toBe(2);
  } finally {
    graph.destroy();
  }
});
