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
      graph.advance(1);
      const bytes = await graph.output.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      errors.push(Math.hypot(values[0] - Math.cos(2), values[2] + Math.sin(2)));
      expect(graph.time).toBe(101);
      expect(graph.remainingTime).toBe(0);
      expect(() => graph.advance(0.1)).toThrow();
      graph.setNextSnapshot(makeRotation(width, (width + 1) / 2, 6), 102);
      graph.advance(1);
      expect(graph.time).toBe(102);
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
