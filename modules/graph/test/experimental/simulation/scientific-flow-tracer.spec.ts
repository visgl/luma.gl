// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it, vi} from 'vitest';
import {
  ScientificFlowTracer,
  ScientificParticleStatus,
  type ScientificVectorFieldInput,
  type ScientificFlowTraceResult
} from '@luma.gl/graph/experimental/simulation';
import {getTestDevice} from '@luma.gl/core/test-utils';

function uniform(speed = 0): ScientificVectorFieldInput {
  return {
    dimensions: ['y', 'x'],
    shape: [2, 2],
    eastward: new Float32Array(4).fill(speed),
    northward: new Float32Array(4),
    valid: new Uint8Array(4).fill(1)
  };
}
function rotation(angularSpeed = 4): ScientificVectorFieldInput {
  return {
    ...uniform(),
    eastward: new Float32Array([0.5, 0.5, -0.5, -0.5]).map(value => value * angularSpeed),
    northward: new Float32Array([-0.5, 0.5, -0.5, 0.5]).map(value => value * angularSpeed)
  };
}
async function read(buffer: ScientificFlowTracer['output']): Promise<Float32Array> {
  const bytes = await buffer.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
async function finish(
  tracer: ScientificFlowTracer,
  duration: number
): Promise<{result: ScientificFlowTraceResult; accepted: number; rejected: number}> {
  let result = await tracer.advance(duration);
  let accepted = result.acceptedSteps;
  let rejected = result.rejectedSteps;
  for (let dispatch = 0; !result.complete && dispatch < 200; dispatch++) {
    result = await tracer.continue();
    accepted += result.acceptedSteps;
    rejected += result.rejectedSteps;
  }
  expect(result.complete).toBe(true);
  return {result, accepted, rejected};
}

it('ScientificFlowTracer tightens analytic rotation error with tolerance', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const errors: number[] = [];
  const work: number[] = [];
  for (const tolerance of [1e-3, 1e-6]) {
    const tracer = new ScientificFlowTracer(device, {
      input: rotation(),
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.75, 0.5]),
      tolerance,
      maximumTimeStep: 1
    });
    try {
      const summary = await finish(tracer, 2);
      const particle = await read(tracer.output);
      errors.push(
        Math.hypot(
          particle[0] - (0.5 + 0.25 * Math.cos(8)),
          particle[1] - (0.5 + 0.25 * Math.sin(8))
        )
      );
      work.push(summary.accepted);
      expect(summary.result.active).toBe(1);
      expect(summary.result.toleranceFailure).toBe(0);
      expect(particle[2]).toBeCloseTo(2, 5);
      expect(particle[3]).toBe(1);
      if (device.features.has('timestamp-query'))
        expect(summary.result.gpuMilliseconds).toBeGreaterThanOrEqual(0);
      else expect(summary.result.gpuMilliseconds).toBeUndefined();
    } finally {
      tracer.destroy();
    }
  }
  expect(errors[1]).toBeLessThan(1e-5);
  expect(errors[1]).toBeLessThan(errors[0] / 10);
  expect(work[1]).toBeGreaterThan(work[0]);
});

it('ScientificFlowTracer retains unfinished work and rejects overlapping requests', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const positions = new Float32Array(129 * 2).fill(0.5);
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(0.01),
    bounds: [0, 0, 1, 1],
    positions,
    tolerance: 1e-5,
    maximumTimeStep: 0.1,
    initialTimeStep: 0.1,
    maximumAttempts: 1
  });
  try {
    const pending = tracer.advance(1);
    await expect(tracer.advance(1)).rejects.toThrow();
    expect(() => tracer.destroy()).toThrow();
    let result = await pending;
    expect(result.complete).toBe(false);
    expect(result.pending).toBe(129);
    expect(result.acceptedSteps).toBe(129);
    expect(tracer.time).toBe(0);
    await expect(tracer.advance(0.5)).rejects.toThrow();
    for (let index = 0; !result.complete && index < 20; index++) result = await tracer.continue();
    expect(result.complete).toBe(true);
    expect(tracer.time).toBe(1);
    const particles = await read(tracer.output);
    for (const index of [0, 128]) {
      expect(particles[index * 4]).toBeCloseTo(0.51, 5);
      expect(particles[index * 4 + 2]).toBeCloseTo(1, 6);
      expect(particles[index * 4 + 3]).toBe(1);
    }
    await expect(tracer.continue()).rejects.toThrow();
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer preserves stopped particles and reports boundary/mask/expiry reasons', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const input = {
    ...uniform(),
    shape: [3, 3] as const,
    eastward: new Float32Array(9),
    northward: new Float32Array(9),
    valid: new Uint8Array(9).fill(1)
  };
  input.valid[0] = 0;
  const tracer = new ScientificFlowTracer(device, {
    input,
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([-0.1, 0.5, 0.1, 0.1, 0.9, 0.9]),
    tolerance: 1e-5,
    lifetime: 0.3
  });
  try {
    const {result} = await finish(tracer, 1);
    expect(result.outsideDomain).toBe(1);
    expect(result.missingData).toBe(1);
    expect(result.expired).toBe(1);
    const state = await read(tracer.diagnostics);
    expect([state[2], state[6], state[10]]).toEqual([
      ScientificParticleStatus.OutsideDomain,
      ScientificParticleStatus.MissingData,
      ScientificParticleStatus.Expired
    ]);
    const particles = await read(tracer.output);
    expect(particles[0]).toBeCloseTo(-0.1, 6);
    expect(particles[4]).toBeCloseTo(0.1, 6);
    expect(particles[10]).toBeCloseTo(0.3, 6);
    await finish(tracer, 1);
    expect(await read(tracer.output)).toEqual(particles);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer reports unmet tolerance instead of force-accepting the minimum step', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: rotation(),
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.75, 0.5]),
    tolerance: 1e-12,
    minimumTimeStep: 0.25,
    maximumTimeStep: 0.25
  });
  try {
    const {result} = await finish(tracer, 1);
    expect(result.toleranceFailure).toBe(1);
    expect(result.rejectedSteps).toBe(1);
    expect(await read(tracer.output)).toEqual(new Float32Array([0.75, 0.5, 0, 1]));
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer rejects an overshooting trial before preserving the last valid position', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(1),
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.9, 0.5]),
    tolerance: 1e-5,
    minimumTimeStep: 0.001,
    maximumTimeStep: 1,
    maximumAttempts: 2
  });
  try {
    const {result, rejected} = await finish(tracer, 1);
    expect(result.outsideDomain).toBe(1);
    expect(rejected).toBeGreaterThan(0);
    const particle = await read(tracer.output);
    expect(particle[0]).toBeGreaterThan(0.99);
    expect(particle[0]).toBeLessThanOrEqual(1);
    expect(particle[2]).toBeLessThanOrEqual(0.101);
    expect(particle[3]).toBe(1);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer samples temporal RK stages and rotates only after continuation finishes', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const epoch = 1700000000;
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(0),
    nextInput: uniform(0.2),
    timeRange: [epoch, epoch + 1],
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.2, 0.5]),
    tolerance: 1e-6,
    maximumTimeStep: 0.25,
    maximumAttempts: 1
  });
  try {
    await expect(tracer.advance(1.1)).rejects.toThrow();
    let result = await tracer.advance(1);
    expect(result.complete).toBe(false);
    expect(() => tracer.setNextSnapshot(uniform(0.4), epoch + 2)).toThrow();
    while (!result.complete) result = await tracer.continue();
    expect(tracer.time).toBe(epoch + 1);
    expect((await read(tracer.output))[0]).toBeCloseTo(0.3, 6);
    const expiredTexture = tracer.field.texture;
    tracer.setNextSnapshot(uniform(0.4), epoch + 2);
    expect(expiredTexture.destroyed).toBe(true);
    await finish(tracer, 1);
    expect((await read(tracer.output))[0]).toBeCloseTo(0.6, 6);
    expect(tracer.time).toBe(epoch + 2);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer advances physical minutes without the visual timestep ceiling', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(1),
    bounds: [0, 0, 10000, 10000],
    positions: new Float32Array([0.2, 0.5]),
    tolerance: 0.1,
    maximumTimeStep: 600,
    minimumTimeStep: 1
  });
  try {
    const {result, accepted} = await finish(tracer, 3600);
    expect(accepted).toBe(6);
    expect(result.active).toBe(1);
    expect((await read(tracer.output))[0]).toBeCloseTo(0.56, 5);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer dispatch budgets preserve accepted trajectories and work counts', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const props = {
    input: rotation(),
    bounds: [0, 0, 1, 1] as const,
    positions: new Float32Array([0.6, 0.5, 0.75, 0.5]),
    tolerance: 1e-6
  };
  const short = new ScientificFlowTracer(device, {...props, maximumAttempts: 1});
  const long = new ScientificFlowTracer(device, {...props, maximumAttempts: 64});
  try {
    const first = await finish(short, 2);
    const second = await finish(long, 2);
    expect(first.accepted).toBe(second.accepted);
    expect(first.rejected).toBe(second.rejected);
    const firstState = await read(short.output);
    const secondState = await read(long.output);
    for (let index = 0; index < firstState.length; index++)
      expect(firstState[index]).toBeCloseTo(secondState[index], 6);
  } finally {
    short.destroy();
    long.destroy();
  }
});

it('ScientificFlowTracer preserves geographic velocity units for physical-time requests', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: {
      ...uniform(1111.9508),
      geographic: {longitudeStart: 0, latitudeStart: 59, longitudeStep: 10, latitudeStep: 2}
    },
    positions: new Float32Array([0.5, 0.5]),
    tolerance: 1,
    minimumTimeStep: 1,
    maximumTimeStep: 600
  });
  try {
    const {result, accepted} = await finish(tracer, 60);
    expect(result.active).toBe(1);
    expect(accepted).toBe(1);
    const particle = await read(tracer.output);
    expect(particle[0]).toBeCloseTo(0.62, 5);
    expect(particle[1]).toBe(0.5);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer reports float32 time stagnation without changing a particle', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(),
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.5, 0.5]),
    tolerance: 1e-5,
    maximumTimeStep: 0.001,
    lifetime: 2e8
  });
  try {
    // A previously released particle with a large float32 age cannot represent this dt.
    const initial = new Float32Array([0.5, 0.5, 1e8, 1]);
    tracer.output.write(initial);
    const {result} = await finish(tracer, 1);
    expect(result.numericalFailure).toBe(1);
    expect(await read(tracer.output)).toEqual(initial);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer completes repeated horizons with roundoff-sized final remainders', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  for (const maximumAttempts of [32, 256]) {
    const tracer = new ScientificFlowTracer(device, {
      input: uniform(0.001),
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.5, 0.5]),
      tolerance: 1e-5,
      maximumTimeStep: 0.01,
      maximumAttempts
    });
    try {
      for (let request = 0; request < 32; request++) {
        const {result} = await finish(tracer, 1);
        expect(result.active).toBe(1);
        expect(result.numericalFailure).toBe(0);
      }
      expect(tracer.time).toBe(32);
      const particle = await read(tracer.output);
      expect(particle[0]).toBeCloseTo(0.532, 4);
      expect(particle[2]).toBeCloseTo(32, 4);
    } finally {
      tracer.destroy();
    }
  }
});

it('ScientificFlowTracer preserves its step proposal across tiny endpoint clips', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(),
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.5, 0.5]),
    tolerance: 1e-5
  });
  try {
    await finish(tracer, 64);
    expect((await finish(tracer, 1 + 2 ** -23)).result.active).toBe(1);
    expect((await read(tracer.diagnostics))[1]).toBe(1);
    const {result, accepted} = await finish(tracer, 1);
    expect(result.active).toBe(1);
    expect(result.numericalFailure).toBe(0);
    expect(accepted).toBe(1);
    expect((await read(tracer.output))[2]).toBe(66);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer inspects real reset/integration encodings across continuation', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(0.01),
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.5, 0.5]),
    tolerance: 1e-5,
    maximumTimeStep: 0.1,
    maximumAttempts: 1
  });
  try {
    const first = await tracer.advance(0.2);
    expect(first.complete).toBe(false);
    expect(first.dispatchIndex).toBe(1);
    expect(first.isContinuation).toBe(false);
    expect(first.targetTime).toBe(0.2);
    expect(first.encoding.stats.nodes.map(node => [node.id, node.type])).toEqual([
      ['reset-trace-counters', 'copy'],
      ['trace-particles-rk45', 'compute']
    ]);
    expect(first.encoding.stats.computePassCount).toBe(1);
    const firstTimings = await first.encoding.readTimings();
    expect(firstTimings.nodes[0].gpuTimeMilliseconds).toBeUndefined();
    expect(firstTimings.nodes[1].gpuTimeMilliseconds).toBe(first.gpuMilliseconds);
    expect(first.encoding.canReadGPUTimings).toBe(device.features.has('timestamp-query'));
    const next = await tracer.continue();
    expect(next.complete).toBe(true);
    expect(next.dispatchIndex).toBe(2);
    expect(next.isContinuation).toBe(true);
    expect(next.targetTime).toBe(0.2);
    expect(next.acceptedSteps).toBe(1); // The reset node prevents counter accumulation.
    expect(next.active).toBe(1);
    expect(next.encoding).not.toBe(first.encoding);
    expect(await first.encoding.readTimings()).toEqual(firstTimings); // Query reuse preserves snapshots.
    const preview = await next.encoding.readResource!('trace-particles-rk45', 1);
    const particles = new Float32Array(preview.data.buffer, preview.data.byteOffset, 4);
    expect(particles[0]).toBeCloseTo(0.502, 6);
    expect(particles[2]).toBeCloseTo(0.2, 6);
    const statistics = await next.encoding.readResource!('trace-particles-rk45', 4);
    expect(
      Array.from(new Uint32Array(statistics.data.buffer, statistics.data.byteOffset, 9))
    ).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 0]);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer graph rebinds both textures after snapshot rotation', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: uniform(0),
    nextInput: uniform(0.2),
    timeRange: [0, 1],
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.2, 0.5]),
    tolerance: 1e-5
  });
  try {
    await finish(tracer, 1);
    tracer.setNextSnapshot(uniform(0.4), 2);
    const {result} = await finish(tracer, 1);
    for (const [resourceIndex, speed] of [
      [5, 0.2],
      [6, 0.4]
    ]) {
      const preview = await result.encoding.readResource!('trace-particles-rk45', resourceIndex);
      expect(new Float32Array(preview.data.buffer, preview.data.byteOffset)[0]).toBeCloseTo(speed);
    }
    expect((await read(tracer.output))[0]).toBeCloseTo(0.6, 6);
    expect(result.targetTime).toBe(2);
  } finally {
    tracer.destroy();
  }
});

it('ScientificFlowTracer retains CPU inspection without timestamp support', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const hasFeature = device.features.has.bind(device.features);
  const featureCheck = vi
    .spyOn(device.features, 'has')
    .mockImplementation(feature => feature !== 'timestamp-query' && hasFeature(feature));
  let tracer: ScientificFlowTracer;
  try {
    tracer = new ScientificFlowTracer(device, {
      input: uniform(),
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.5, 0.5]),
      tolerance: 1e-5
    });
  } finally {
    featureCheck.mockRestore();
  }
  try {
    const result = await tracer.advance(1);
    expect(result.complete).toBe(true);
    expect(result.gpuMilliseconds).toBeUndefined();
    expect(result.encoding.canReadGPUTimings).toBe(false);
    const report = await result.encoding.readTimings();
    expect(report.nodes).toHaveLength(2);
    expect(report.cpuEncodeTimeMilliseconds).toBeGreaterThanOrEqual(0);
    expect(report.nodes.every(node => node.gpuTimeMilliseconds === undefined)).toBe(true);
  } finally {
    tracer.destroy();
  }
});
