// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {
  ScientificFlowTracer,
  type ScientificVectorFieldInput
} from '@luma.gl/graph/experimental-simulation';

/** Sample a manufactured horizontal velocity onto a regular grid. */
function makeField(
  size: number,
  velocity: (vertical: number) => number
): ScientificVectorFieldInput {
  return {
    dimensions: ['y', 'x'],
    shape: [size, size],
    eastward: Float32Array.from({length: size * size}, (_, index) =>
      velocity(Math.floor(index / size) / (size - 1))
    ),
    northward: new Float32Array(size * size),
    valid: new Uint8Array(size * size).fill(1)
  };
}

/** Finish bounded work while detecting stalled continuations. */
async function advance(tracer: ScientificFlowTracer, duration: number): Promise<void> {
  let result = await tracer.advance(duration);
  for (let dispatch = 0; !result.complete && dispatch < 256; dispatch++)
    result = await tracer.continue();
  expect(result.complete).toBe(true);
  expect(result.active).toBe(tracer.particleCount);
}

/** Read positions explicitly for qualification only. */
async function readPosition(tracer: ScientificFlowTracer): Promise<Float32Array> {
  const bytes = await tracer.output.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, 4);
}

it('separates spatial interpolation error from RK45 integration error', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const errors: number[] = [];
  for (const size of [5, 9, 17]) {
    const tracer = new ScientificFlowTracer(device, {
      input: makeField(size, vertical => 0.1 * vertical ** 2),
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.2, 0.3]),
      tolerance: 1e-7,
      maximumAttempts: 1
    });
    try {
      await advance(tracer, 1);
      const position = await readPosition(tracer);
      // Exact solution for the piecewise-linear sampled field, independently of RK stages.
      const lower = Math.floor(0.3 * (size - 1)) / (size - 1);
      const upper = lower + 1 / (size - 1);
      const weight = (0.3 - lower) / (upper - lower);
      const sampledSolution = 0.2 + 0.1 * ((1 - weight) * lower ** 2 + weight * upper ** 2);
      expect(Math.abs(position[0] - sampledSolution)).toBeLessThan(1e-6);
      errors.push(Math.abs(position[0] - (0.2 + 0.1 * 0.3 ** 2)));
    } finally {
      tracer.destroy();
    }
  }
  expect(errors[1]).toBeLessThan(errors[0] / 2);
  expect(errors[2]).toBeLessThan(errors[1] / 2);
});

it('qualifies temporal interpolation convergence independently of RK45 tolerance', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const errors: number[] = [];
  for (const intervals of [1, 2, 4]) {
    const makeSnapshot = (time: number) => makeField(2, () => 0.1 * time ** 2);
    const tracer = new ScientificFlowTracer(device, {
      input: makeSnapshot(0),
      nextInput: makeSnapshot(1 / intervals),
      timeRange: [0, 1 / intervals],
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.2, 0.5]),
      tolerance: 1e-7,
      maximumAttempts: 1
    });
    try {
      for (let interval = 0; interval < intervals; interval++) {
        if (interval)
          tracer.setNextSnapshot(
            makeSnapshot((interval + 1) / intervals),
            (interval + 1) / intervals
          );
        await advance(tracer, 1 / intervals);
      }
      const position = await readPosition(tracer);
      const analyticSolution = 0.2 + 0.1 / 3;
      // Composite trapezoidal integral of t^2 is exact for the interpolated snapshots.
      const interpolationError = 0.1 / (6 * intervals ** 2);
      expect(Math.abs(position[0] - analyticSolution - interpolationError)).toBeLessThan(1e-6);
      errors.push(Math.abs(position[0] - analyticSolution));
      expect(tracer.time).toBe(1);
    } finally {
      tracer.destroy();
    }
  }
  expect(errors[0] / errors[1]).toBeCloseTo(4, 2);
  expect(errors[1] / errors[2]).toBeCloseTo(4, 2);
});

for (const conservativeMask of [false, true]) {
  it(`RK45 crosses a clear diagonal without checking adjacent cells (${conservativeMask})`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const input = makeField(4, () => 0.1);
    input.northward.fill(0.1);
    input.valid[2] = 0; // Adjacent to the diagonal path, inside its swept interpolation rectangle.
    const tracer = new ScientificFlowTracer(device, {
      input,
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.32, 0.32]),
      tolerance: 1e-6,
      minimumTimeStep: 0.0001,
      conservativeMask
    });
    try {
      let result = await tracer.advance(0.3);
      for (let dispatch = 0; !result.complete && dispatch < 100; dispatch++)
        result = await tracer.continue();
      expect(result.complete).toBe(true);
      expect(result.missingData).toBe(0);
      const position = await readPosition(tracer);
      expect(position[0]).toBeCloseTo(0.35, 5);
      expect(position[3]).toBe(1);
    } finally {
      tracer.destroy();
    }
  });
}

it('conservative masks respect snapshot weights and stop before a masked strip', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const input = makeField(9, () => 0.2);
  for (let row = 0; row < 9; row++) input.valid[row * 9 + 4] = 0;
  const tracer = new ScientificFlowTracer(device, {
    input,
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.2, 0.5]),
    tolerance: 1e-6,
    conservativeMask: true
  });
  try {
    let result = await tracer.advance(2);
    for (let dispatch = 0; !result.complete && dispatch < 100; dispatch++)
      result = await tracer.continue();
    expect(result.complete).toBe(true);
    expect(result.missingData).toBe(1);
    expect((await readPosition(tracer))[0]).toBeLessThan(3 / 8);
  } finally {
    tracer.destroy();
  }

  // An invalid future snapshot must not affect sampling exactly at the current endpoint.
  const future = makeField(2, () => 0);
  future.valid.fill(0);
  const temporalTracer = new ScientificFlowTracer(device, {
    input: makeField(2, () => 0),
    nextInput: future,
    timeRange: [0, 1],
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.5, 0.5]),
    tolerance: 1e-6,
    conservativeMask: true
  });
  try {
    expect((await temporalTracer.advance(0)).active).toBe(1);
    const result = await temporalTracer.advance(0.1);
    expect(result.complete).toBe(true);
    expect(result.missingData).toBe(1);
    expect((await readPosition(temporalTracer))[2]).toBe(0);
  } finally {
    temporalTracer.destroy();
  }
});

for (const conservativeMask of [false, true]) {
  it(`RK45 detects a brief masked-cell crossing between stages (${conservativeMask})`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const input = makeField(4, () => 0.1);
    input.northward.fill(0.1);
    input.valid[2] = 0;
    const tracer = new ScientificFlowTracer(device, {
      input,
      bounds: [0, 0, 1, 1],
      // Cross column 1 at t=.12 and row 1 at t=.13; no RK stage lands between them.
      positions: new Float32Array([1 / 3 - 0.012, 1 / 3 - 0.013]),
      tolerance: 1e-6,
      minimumTimeStep: 0.0001,
      conservativeMask
    });
    try {
      let result = await tracer.advance(0.3);
      for (let dispatch = 0; !result.complete && dispatch < 100; dispatch++)
        result = await tracer.continue();
      expect(result.complete).toBe(true);
      expect(result.missingData).toBe(conservativeMask ? 1 : 0);
      const position = await readPosition(tracer);
      if (conservativeMask) expect(position[0]).toBeLessThan(1 / 3);
      else expect(position[0]).toBeCloseTo(1 / 3 + 0.018, 5);
      expect(position[3]).toBe(1);
    } finally {
      tracer.destroy();
    }
  });
}

it('preserves analytic eastward travel across the supported latitude range', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  // Binary fractions make latitude reconstruction exact on both CPU and GPU.
  const verticals = [0, 0.03125, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.96875, 1];
  const tracer = new ScientificFlowTracer(device, {
    input: {
      ...makeField(2, () => 20),
      geographic: {longitudeStart: 0, latitudeStart: -85, longitudeStep: 90, latitudeStep: 170}
    },
    positions: Float32Array.from(verticals.flatMap(vertical => [0, vertical])),
    tolerance: 1,
    maximumTimeStep: 3600
  });
  try {
    await advance(tracer, 3600);
    const bytes = await tracer.output.readAsync();
    const particles = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    for (let index = 0; index < verticals.length; index++) {
      const latitude = -85 + 170 * verticals[index];
      const metresPerDegree = ((6371008.8 * Math.PI) / 180) * Math.cos((latitude * Math.PI) / 180);
      const distance = particles[index * 4] * 90 * metresPerDegree;
      expect(Math.abs(distance - 20 * 3600)).toBeLessThan(0.2);
      expect(particles[index * 4 + 1]).toBe(verticals[index]);
    }
  } finally {
    tracer.destroy();
  }
});
