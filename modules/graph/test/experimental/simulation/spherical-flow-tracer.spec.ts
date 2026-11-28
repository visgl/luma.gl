// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {SphericalFlowTracer} from '@luma.gl/graph/experimental-simulation';

/** Uniform world velocity gives exact projected flow z=tanh(integral(speed/radius)). */
function makeUniform(speed = 1) {
  const velocity = new Float32Array(27);
  for (let index = 0; index < 9; index++) velocity[index * 3 + 2] = speed;
  return {shape: [3, 3] as const, velocity};
}

for (const maximumAttempts of [1, 32]) {
  it(`adaptive sphere preserves analytic projected flow with ${maximumAttempts} trials per call`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const tracer = new SphericalFlowTracer(device, {
      input: makeUniform(),
      positions: new Float32Array([1, 0, 0, 0, 0, 1]),
      radius: 1,
      tolerance: 1e-6,
      minimumTimeStep: 1e-5,
      maximumTimeStep: 1,
      maximumAttempts
    });
    try {
      let result = await tracer.advance(2);
      let rejected = result.rejectedSteps;
      for (let count = 0; !result.complete && count < 100; count++) {
        expect(tracer.time).toBe(0);
        result = await tracer.continue();
        rejected += result.rejectedSteps;
      }
      expect(result.complete).toBe(true);
      expect(result.active).toBe(2);
      expect(result.numericalFailure).toBe(0);
      expect(rejected).toBeGreaterThan(0);
      const bytes = await tracer.output.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
      expect(
        Math.hypot(values[0] - 1 / Math.cosh(2), values[1], values[2] - Math.tanh(2))
      ).toBeLessThan(1e-5);
      expect(Math.hypot(...values.subarray(0, 3))).toBeCloseTo(1, 6);
      expect(Array.from(values.subarray(4, 7))).toEqual([0, 0, 1]);
      expect(tracer.time).toBe(2);
      expect(result.encodings).toHaveLength(1);
      expect(result.counterReadbackBytes).toBe(36);
      const zero = await tracer.advance(0);
      expect(zero.acceptedSteps).toBe(0);
      const previous = await tracer.previous.readAsync();
      expect(Array.from(previous)).toEqual(Array.from(await tracer.output.readAsync()));
    } finally {
      tracer.destroy();
    }
  });
}

it('adaptive sphere rotates temporal snapshots without extrapolation and clips lifetimes', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new SphericalFlowTracer(device, {
    input: makeUniform(1),
    nextInput: makeUniform(3),
    timeRange: [100, 101],
    positions: new Float32Array([1, 0, 0]),
    radius: 2,
    tolerance: 1e-6,
    maximumTimeStep: 0.1,
    maximumAttempts: 2,
    lifetime: 1.5
  });
  try {
    let result = await tracer.advance(1);
    expect(() => tracer.setNextSnapshot(makeUniform(5), 102)).toThrow();
    while (!result.complete) result = await tracer.continue();
    await expect(tracer.advance(0.1)).rejects.toThrow();
    tracer.setNextSnapshot(makeUniform(5), 102);
    result = await tracer.advance(1);
    while (!result.complete) result = await tracer.continue();
    expect(result.expired).toBe(1);
    expect(result.active).toBe(0);
    expect(tracer.time).toBe(102);
    const bytes = await tracer.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, 4);
    // Integral is 1 over the first interval and 0.875 over half the second.
    expect(values[2]).toBeCloseTo(Math.tanh(1.875), 5);
    expect(values[3]).toBe(1.5);
  } finally {
    tracer.destroy();
  }
});

it('adaptive sphere reports unmet tolerance instead of accepting at its timestep floor', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new SphericalFlowTracer(device, {
    input: makeUniform(),
    positions: new Float32Array([1, 0, 0]),
    radius: 1,
    tolerance: 1e-9,
    minimumTimeStep: 0.5,
    maximumTimeStep: 0.5
  });
  try {
    const result = await tracer.advance(1);
    expect(result.complete).toBe(true);
    expect(result.toleranceFailure).toBe(1);
    expect(result.acceptedSteps).toBe(0);
    const bytes = await tracer.output.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([1, 0, 0, 0]);
  } finally {
    tracer.destroy();
  }
});

/** Solid-body rotation about y crosses both poles and the longitude seam. */
function makeRotation(width: number, speed = 1) {
  const height = (width + 1) / 2;
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

it('adaptive sphere crosses both poles and the seam with spatial refinement independent of tolerance', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const errors: number[] = [];
  for (const width of [17, 65, 129]) {
    const tracer = new SphericalFlowTracer(device, {
      input: makeRotation(width),
      positions: new Float32Array([1, 0, 0, 0, 1, 0]),
      radius: 1,
      tolerance: 1e-6,
      maximumTimeStep: 0.01
    });
    try {
      let maximumError = 0;
      for (let quarter = 1; quarter <= 4; quarter++) {
        let result = await tracer.advance(Math.PI / 2);
        while (!result.complete) result = await tracer.continue();
        expect(result.active).toBe(2);
        const bytes = await tracer.output.readAsync();
        const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
        maximumError = Math.max(
          maximumError,
          Math.hypot(
            values[0] - Math.cos((quarter * Math.PI) / 2),
            values[1],
            values[2] + Math.sin((quarter * Math.PI) / 2)
          )
        );
        expect(Math.hypot(...values.subarray(0, 3))).toBeCloseTo(1, 6);
        expect(Math.hypot(values[4], values[5] - 1, values[6])).toBeLessThan(1e-6);
      }
      errors.push(maximumError);
    } finally {
      tracer.destroy();
    }
  }
  expect(errors[1]).toBeLessThan(errors[0] / 8);
  expect(errors[2]).toBeLessThan(errors[1] / 3);
  expect(errors[2]).toBeLessThan(0.004);
});

it('adaptive sphere validates inputs and preserves ownership across rejected snapshot changes', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const props = {
    input: makeUniform(),
    positions: new Float32Array([1, 0, 0]),
    radius: 1,
    tolerance: 1e-5,
    maximumTimeStep: 0.1
  };
  for (const invalid of [
    {radius: 0},
    {tolerance: NaN},
    {maximumAttempts: 257},
    {dispatchesPerReadback: 33},
    {minimumTimeStep: 1},
    {positions: new Float32Array([0, 0, 0])},
    {nextInput: makeUniform()}
  ]) {
    expect(() => new SphericalFlowTracer(device, {...props, ...invalid})).toThrow();
  }
  expect(
    () => new SphericalFlowTracer(device, {...props, nextInput: makeRotation(5), timeRange: [0, 1]})
  ).toThrow();
  const tracer = new SphericalFlowTracer(device, {
    ...props,
    nextInput: makeUniform(2),
    timeRange: [0, 0.1]
  });
  try {
    const pending = tracer.advance(0.1);
    expect(() => tracer.destroy()).toThrow();
    await expect(tracer.advance(0.1)).rejects.toThrow();
    let result = await pending;
    while (!result.complete) result = await tracer.continue();
    expect(() => tracer.setNextSnapshot(makeRotation(5), 0.2)).toThrow();
    expect(tracer.remainingTime).toBe(0);
    tracer.setNextSnapshot(makeUniform(3), 0.2);
    result = await tracer.advance(0.1);
    while (!result.complete) result = await tracer.continue();
    expect(result.active).toBe(1);
  } finally {
    tracer.destroy();
    tracer.destroy();
  }
  await expect(tracer.advance(0)).rejects.toThrow();
});

for (const scheduling of ['dense', 'persistent'] as const) {
  it(`matches ${scheduling} batches and single dispatches across a reversing spherical rotation`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const initial = new Float32Array([1, 0, 0, 0, 1, 0]);
    const props = {
      input: makeRotation(129, 2),
      nextInput: makeRotation(129, 0),
      timeRange: [0, 2] as const,
      positions: initial,
      radius: 1,
      tolerance: 1e-6,
      maximumTimeStep: 0.025,
      maximumAttempts: 4
    };
    const single = new SphericalFlowTracer(device, props);
    const batched = new SphericalFlowTracer(device, {
      ...props,
      dispatchesPerReadback: 8,
      scheduling
    });
    try {
      for (const [speed, angle] of [
        [0, 2],
        [-2, 0]
      ]) {
        if (speed < 0) {
          for (const tracer of [single, batched])
            tracer.setNextSnapshot(makeRotation(129, speed), 4);
        }
        const totals = [];
        for (const tracer of [single, batched]) {
          const before = await tracer.output.readAsync();
          let result = await tracer.advance(2);
          expect(await tracer.previous.readAsync()).toEqual(before);
          const batchSize = tracer === batched ? 8 : 1;
          expect(result.encodings).toHaveLength(batchSize);
          expect(result.counterReadbackBytes).toBe(
            batchSize * (tracer === batched && scheduling === 'persistent' ? 44 : 36)
          );
          let accepted = result.acceptedSteps;
          let rejected = result.rejectedSteps;
          for (let call = 0; !result.complete && call < 100; call++) {
            result = await tracer.continue();
            accepted += result.acceptedSteps;
            rejected += result.rejectedSteps;
          }
          expect(result.complete).toBe(true);
          expect(result.active).toBe(2);
          totals.push([accepted, rejected]);
          const bytes = await tracer.output.readAsync();
          const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
          expect(
            Math.hypot(values[0] - Math.cos(angle), values[1], values[2] + Math.sin(angle))
          ).toBeLessThan(0.004);
          expect(Math.hypot(...values.subarray(0, 3))).toBeCloseTo(1, 6);
        }
        expect(totals[1]).toEqual(totals[0]);
        expect(await batched.output.readAsync()).toEqual(await single.output.readAsync());
        expect(await batched.diagnostics.readAsync()).toEqual(await single.diagnostics.readAsync());
      }
    } finally {
      batched.destroy();
      single.destroy();
    }
  });
}
