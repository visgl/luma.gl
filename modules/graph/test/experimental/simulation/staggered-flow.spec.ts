// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {
  ScientificFlowField,
  ScientificFlowGraph,
  ScientificFlowTracer,
  type StaggeredVectorFieldInput
} from '../../../src/experimental/simulation/index';

/** Independent face samples of the divergence-free strain u=a*x, v=-a*y. */
function strain(columns = 8, rows = 4, speed = 0.3): StaggeredVectorFieldInput {
  return {
    layout: 'c-grid',
    shape: [rows, columns],
    eastward: Float32Array.from(
      {length: rows * (columns + 1)},
      (_, index) => (speed * (index % (columns + 1)) * 4) / columns
    ),
    northward: Float32Array.from(
      {length: (rows + 1) * columns},
      (_, index) => (-speed * Math.floor(index / columns) * 2) / rows
    ),
    eastwardValid: new Uint8Array(rows * (columns + 1)).fill(1),
    northwardValid: new Uint8Array((rows + 1) * columns).fill(1)
  };
}

/** Uniform face velocity is continuous across the periodic seam. */
function uniform(speed: number): StaggeredVectorFieldInput {
  const input = strain();
  input.eastward.fill(speed);
  input.northward.fill(0);
  return input;
}

for (const integrator of ['rk2', 'rk4', 'rk45'] as const) {
  it(`${integrator} transports a C-grid strain across cells with analytic divergence-free trajectories`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const positions = new Float32Array([0.1, 0.8, 0.35, 0.6, 0.6, 0.2]);
    const props = {input: strain(), bounds: [0, 0, 4, 2] as const};
    const graph =
      integrator === 'rk45'
        ? new ScientificFlowTracer(device, {
            ...props,
            positions,
            tolerance: 1e-6,
            maximumTimeStep: 0.1,
            maximumAttempts: 256
          })
        : new ScientificFlowGraph(device, {...props, particleCount: 3, integrator});
    try {
      if (graph instanceof ScientificFlowGraph) {
        graph.output.write(new Float32Array([0.1, 0.8, 0, 1, 0.35, 0.6, 0, 1, 0.6, 0.2, 0, 1]));
        graph.advance(1);
      } else {
        let result = await graph.advance(1);
        while (!result.complete) result = await graph.continue();
        expect(result.active).toBe(3);
      }
      const bytes = await graph.output.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      for (let index = 0; index < 3; index++) {
        expect(Math.abs(values[index * 4] - positions[index * 2] * Math.exp(0.3))).toBeLessThan(
          0.00001
        );
        expect(
          Math.abs(values[index * 4 + 1] - positions[index * 2 + 1] * Math.exp(-0.3))
        ).toBeLessThan(0.00001);
      }
    } finally {
      graph.destroy();
    }
  });
}

it('distinguishes missing component faces from valid zero-flow walls', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  for (const component of ['eastward', 'northward'] as const) {
    const input = uniform(0);
    if (component === 'eastward') input.eastwardValid[1] = 0;
    else input.northwardValid[8] = 0;
    const tracer = new ScientificFlowTracer(device, {
      input,
      bounds: [0, 0, 4, 2],
      positions: new Float32Array([0.05, 0.1, 0.8, 0.8]),
      tolerance: 1e-6,
      conservativeMask: true
    });
    try {
      const result = await tracer.advance(1);
      expect(result.missingData).toBe(1);
      expect(result.active).toBe(1);
      expect(result.complete).toBe(true);
    } finally {
      tracer.destroy();
    }
  }
});

it('interpolates and rotates C-grid snapshots across the periodic seam', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(0.1),
    nextInput: uniform(0.3),
    timeRange: [10, 12],
    bounds: [0, 0, 1, 1],
    periodicLongitude: true,
    conservativeMask: true,
    positions: new Float32Array([0.9, 0.4]),
    tolerance: 1e-6,
    maximumTimeStep: 0.1,
    maximumAttempts: 256
  });
  try {
    let result = await tracer.advance(2);
    while (!result.complete) result = await tracer.continue();
    expect(result.active).toBe(1);
    let bytes = await tracer.output.readAsync();
    expect(new Float32Array(bytes.buffer, bytes.byteOffset, 4)[0]).toBeCloseTo(0.3, 5);
    tracer.setNextSnapshot(uniform(0.5), 14);
    result = await tracer.advance(2);
    while (!result.complete) result = await tracer.continue();
    bytes = await tracer.output.readAsync();
    expect(new Float32Array(bytes.buffer, bytes.byteOffset, 4)[0]).toBeCloseTo(0.1, 5);
    expect(tracer.time).toBe(14);
  } finally {
    tracer.destroy();
  }
});

it('rejects invalid face contracts and mixed temporal layouts', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const input = uniform(1);
  expect(
    () => new ScientificFlowField(device, {input, bounds: [0, 0, 1, 1], coordinates: 'lnglat'})
  ).toThrow();
  expect(() => new ScientificFlowField(device, {input})).toThrow();
  expect(
    () =>
      new ScientificFlowField(device, {
        input: {...input, northwardValid: new Uint8Array(1)},
        bounds: [0, 0, 1, 1]
      })
  ).toThrow();
  input.eastward[0] = 2;
  expect(
    () => new ScientificFlowField(device, {input, bounds: [0, 0, 1, 1], periodicLongitude: true})
  ).toThrow();
  input.eastward[0] = NaN;
  expect(() => new ScientificFlowField(device, {input, bounds: [0, 0, 1, 1]})).toThrow();
  const collocated = {
    dimensions: ['y', 'x'] as const,
    shape: [5, 9] as const,
    eastward: new Float32Array(45),
    northward: new Float32Array(45),
    valid: new Uint8Array(45).fill(1)
  };
  expect(
    () =>
      new ScientificFlowTracer(device, {
        input: uniform(0),
        nextInput: collocated,
        timeRange: [0, 1],
        bounds: [0, 0, 1, 1],
        positions: new Float32Array([0.5, 0.5]),
        tolerance: 1e-6
      })
  ).toThrow();
});
