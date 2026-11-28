// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {SphericalFlowGraph, SphericalFlowField} from '../../../src/experimental/simulation/index';

/** Rotation about the y axis crosses both poles and the antimeridian. */
function makeRotation(width = 129, height = 65, speed = 1) {
  const velocity = new Float32Array(width * height * 3);
  for (let row = 0; row < height; row++) {
    const latitude = -Math.PI / 2 + (row / (height - 1)) * Math.PI;
    for (let column = 0; column < width; column++) {
      const longitude = -Math.PI + (column / (width - 1)) * 2 * Math.PI;
      velocity.set(
        [speed * Math.sin(latitude), 0, -speed * Math.cos(latitude) * Math.cos(longitude)],
        (row * width + column) * 3
      );
    }
  }
  return {shape: [height, width] as const, velocity};
}

for (const integrator of ['rk2', 'rk4'] as const) {
  it(`${integrator} crosses both poles with stable slots and bounded radius and angular error`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const graph = new SphericalFlowGraph(device, {
      integrator,
      input: makeRotation(),
      positions: new Float32Array([1, 0, 0, 0, 1, 0]),
      radius: 1,
      maximumTimeStep: 0.01
    });
    try {
      for (let quarter = 1; quarter <= 4; quarter++) {
        graph.advance(Math.PI / 2);
        const bytes = await graph.output.readAsync();
        const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
        expect(Math.hypot(values[0], values[1], values[2])).toBeCloseTo(1, 6);
        expect(
          Math.hypot(
            values[0] - Math.cos((quarter * Math.PI) / 2),
            values[1],
            values[2] + Math.sin((quarter * Math.PI) / 2)
          )
        ).toBeLessThan(0.004);
        expect(Math.hypot(values[4], values[5] - 1, values[6])).toBeLessThan(1e-6);
        expect(values[3]).toBeCloseTo((quarter * Math.PI) / 2, 4);
      }
    } finally {
      graph.destroy();
    }
  });
}

it('refines the global grid and interpolates physical-time snapshots', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const errors: number[] = [];
  for (const width of [17, 65]) {
    const graph = new SphericalFlowGraph(device, {
      input: makeRotation(width, (width + 1) / 2, 2),
      nextInput: makeRotation(width, (width + 1) / 2, 6),
      timeRange: [100, 101],
      positions: new Float32Array([1, 0, 0]),
      radius: 2,
      maximumTimeStep: 0.005
    });
    try {
      graph.advance(0.25);
      const intermediateBytes = await graph.output.readAsync();
      const intermediate = new Float32Array(
        intermediateBytes.buffer,
        intermediateBytes.byteOffset,
        intermediateBytes.byteLength / 4
      );
      // Integrating the first quarter distinguishes forward from reversed snapshot blending.
      expect(
        Math.hypot(intermediate[0] - Math.cos(0.3125), intermediate[2] + Math.sin(0.3125))
      ).toBeLessThan(0.02);
      graph.advance(0.75);
      const bytes = await graph.output.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      errors.push(Math.hypot(values[0] - Math.cos(2), values[2] + Math.sin(2)));
      expect(graph.time).toBe(101);
      expect(graph.remainingTime).toBe(0);
      expect(() => graph.advance(0.1)).toThrow();
      graph.setNextSnapshot(makeRotation(width, (width + 1) / 2, 10), 102);
      graph.advance(1);
      expect(graph.time).toBe(102);
      const rotatedBytes = await graph.output.readAsync();
      const rotated = new Float32Array(
        rotatedBytes.buffer,
        rotatedBytes.byteOffset,
        rotatedBytes.byteLength / 4
      );
      expect(Math.hypot(rotated[0] - Math.cos(6), rotated[2] + Math.sin(6))).toBeLessThan(
        width === 17 ? 0.2 : 0.02
      );
    } finally {
      graph.destroy();
    }
  }
  expect(errors[1]).toBeLessThan(errors[0] / 8);
  expect(errors[1]).toBeLessThan(0.004);
});

it('rejects discontinuous seams and inconsistent pole vectors', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const seam = makeRotation(9, 5);
  seam.velocity[(2 * 9 + 8) * 3] += 1;
  expect(() => new SphericalFlowField(device, seam)).toThrow();
  const pole = makeRotation(9, 5);
  pole.velocity[3] += 1;
  expect(() => new SphericalFlowField(device, pole)).toThrow();
});

it('projects a constant world vector onto the tangent plane', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  // A constant world field is interpolated exactly and has a changing radial component.
  const velocity = new Float32Array(27);
  for (let index = 0; index < 9; index++) velocity.set([1, 2, 3], index * 3);
  const graph = new SphericalFlowGraph(device, {
    input: {shape: [3, 3], velocity},
    positions: new Float32Array([1, 0, 0]),
    radius: 1,
    maximumTimeStep: 0.05
  });
  try {
    graph.advance(0.3);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    const speed = Math.sqrt(14);
    const initialParallel = 1 / speed;
    const parallel = Math.tanh(speed * 0.3 + Math.atanh(initialParallel));
    const transverse = Math.sqrt(
      (1 - parallel * parallel) / (1 - initialParallel * initialParallel)
    );
    const expected = [1, 2, 3].map(
      (component, index) =>
        (component / speed) * parallel +
        ((index === 0 ? 1 : 0) - (component / speed) * initialParallel) * transverse
    );
    expect(
      Math.hypot(...expected.map((component, index) => component - values[index]))
    ).toBeLessThan(0.00001);
  } finally {
    graph.destroy();
  }
});

it('samples longitude with the correct sign away from the coordinate axes', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const input = makeRotation();
  for (let row = 0; row < 65; row++) {
    const latitude = -Math.PI / 2 + (row / 64) * Math.PI;
    for (let column = 0; column < 129; column++) {
      const longitude = -Math.PI + (column / 128) * 2 * Math.PI;
      input.velocity.set(
        [-Math.cos(latitude) * Math.sin(longitude), Math.cos(latitude) * Math.cos(longitude), 0],
        (row * 129 + column) * 3
      );
    }
  }
  const graph = new SphericalFlowGraph(device, {
    input,
    positions: new Float32Array([Math.cos(0.7), Math.sin(0.7), 0]),
    radius: 1,
    maximumTimeStep: 0.01
  });
  try {
    graph.advance(0.8);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    expect(
      Math.hypot(values[0] - Math.cos(1.5), values[1] - Math.sin(1.5), values[2])
    ).toBeLessThan(0.001);
  } finally {
    graph.destroy();
  }
});

it('uses explicit physical timesteps for an Earth-radius one-hour rotation', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const radius = 6371000;
  const graph = new SphericalFlowGraph(device, {
    input: makeRotation(129, 65, 10),
    positions: new Float32Array([Math.SQRT1_2, Math.SQRT1_2, 0]),
    radius,
    maximumTimeStep: 60
  });
  try {
    graph.advance(3600);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    const angle = 36000 / radius;
    expect(
      Math.hypot(
        values[0] - Math.SQRT1_2 * Math.cos(angle),
        values[1] - Math.SQRT1_2,
        values[2] + Math.SQRT1_2 * Math.sin(angle)
      )
    ).toBeLessThan(0.00001);
    expect(values[3]).toBe(3600);
  } finally {
    graph.destroy();
  }
});

it('splits long advances and permits the timestep division roundoff', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const graph = new SphericalFlowGraph(device, {
    input: makeRotation(9, 5, 0),
    positions: new Float32Array([1, 0, 0]),
    radius: 1,
    maximumTimeStep: 0.03
  });
  try {
    graph.advance(1.05);
    graph.advance(300);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    expect(Array.from(values.slice(0, 3))).toEqual([1, 0, 0]);
    expect(graph.time).toBeCloseTo(301.05, 10);
    expect(values[3]).toBeCloseTo(301.05, 3);
  } finally {
    graph.destroy();
  }
});

it('finishes a multi-dispatch snapshot horizon with accepted endpoint roundoff', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const endTime = 122.91;
  const graph = new SphericalFlowGraph(device, {
    input: makeRotation(9, 5, 0),
    nextInput: makeRotation(9, 5, 0),
    timeRange: [0, endTime],
    positions: new Float32Array([1, 0, 0]),
    radius: 1,
    maximumTimeStep: 0.03
  });
  try {
    const initial = graph.output;
    expect(() => graph.advance(endTime + 1)).toThrow();
    expect(graph.output).toBe(initial);
    expect(graph.time).toBe(0);
    graph.advance(endTime * (1 + 5e-13));
    expect(graph.time).toBe(endTime);
    expect(graph.remainingTime).toBe(0);
    const bytes = await graph.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    expect(Array.from(values.slice(0, 3))).toEqual([1, 0, 0]);
    expect(values[3]).toBeCloseTo(endTime, 3);
  } finally {
    graph.destroy();
  }
});
