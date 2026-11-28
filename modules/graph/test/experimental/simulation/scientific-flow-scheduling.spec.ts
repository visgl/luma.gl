// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {ScientificFlowTracer} from '../../../src/experimental/simulation/index';

for (const dispatchesPerReadback of [1, 4, 16]) {
  it(`active scheduling preserves stable states and work with ${dispatchesPerReadback}-dispatch batches`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const reports: {
      states: number[];
      diagnostics: number[];
      previous: number[];
      accepted: number;
      rejected: number;
    }[] = [];
    for (const scheduling of ['dense', 'active', 'persistent'] as const) {
      const positions = new Float32Array(259 * 2).fill(-0.1);
      for (const index of [0, 127, 128, 258]) positions.set([0.6 + index / 4000, 0.5], index * 2);
      const tracer = new ScientificFlowTracer(device, {
        input: {
          dimensions: ['y', 'x'],
          shape: [2, 2],
          eastward: new Float32Array([2, 2, -2, -2]),
          northward: new Float32Array([-2, 2, -2, 2]),
          valid: new Uint8Array(4).fill(1)
        },
        bounds: [0, 0, 1, 1],
        positions,
        tolerance: 1e-6,
        minimumTimeStep: 1e-5,
        maximumTimeStep: 0.25,
        maximumAttempts: 2,
        dispatchesPerReadback,
        scheduling
      });
      try {
        let result = await tracer.advance(0.5);
        let accepted = result.acceptedSteps;
        let rejected = result.rejectedSteps;
        for (let continuation = 0; !result.complete && continuation < 100; continuation++) {
          result = await tracer.continue();
          accepted += result.acceptedSteps;
          rejected += result.rejectedSteps;
        }
        expect(result.complete).toBe(true);
        expect(result.active).toBe(4);
        expect(result.outsideDomain).toBe(255);
        expect(rejected).toBeGreaterThan(0);
        if (scheduling !== 'dense') {
          expect(result.scheduledParticles).toBeLessThanOrEqual(
            259 + 4 * (dispatchesPerReadback - 1)
          );
          expect(result.integrationWorkgroups).toBeLessThanOrEqual(3 + dispatchesPerReadback - 1);
          expect(result.counterReadbackBytes).toBe(44 * dispatchesPerReadback);
        }
        // Zero horizon must refresh previous for all slots while launching no queued trials.
        result = await tracer.advance(0);
        expect(result.active).toBe(4);
        expect(result.outsideDomain).toBe(255);
        if (scheduling !== 'dense') {
          expect(result.scheduledParticles).toBe(0);
          expect(result.integrationWorkgroups).toBe(0);
        }
        const read = async (buffer: typeof tracer.output) => {
          const bytes = await buffer.readAsync();
          return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
        };
        const states = await read(tracer.output);
        const previous = await read(tracer.previous);
        expect(previous).toEqual(states);
        for (const index of [0, 127, 128, 258]) {
          const radius = positions[index * 2] - 0.5;
          expect(
            Math.hypot(
              states[index * 4] - (0.5 + radius * Math.cos(2)),
              states[index * 4 + 1] - (0.5 + radius * Math.sin(2))
            )
          ).toBeLessThan(1e-5);
        }
        reports.push({
          states,
          previous,
          diagnostics: await read(tracer.diagnostics),
          accepted,
          rejected
        });
        // A subsequent nonzero horizon must rebuild the queue, not reuse the empty command.
        result = await tracer.advance(0.1);
        while (!result.complete) result = await tracer.continue();
        expect(result.active).toBe(4);
        expect(tracer.time).toBeCloseTo(0.6, 12);
      } finally {
        tracer.destroy();
      }
    }
    expect(reports[1]).toEqual(reports[0]);
    expect(reports[2]).toEqual(reports[0]);
  });
}

it('active queue counts terminal lifetimes and missing-data slots through idle tails', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  for (const valid of [0, 1]) {
    const tracer = new ScientificFlowTracer(device, {
      input: {
        dimensions: ['y', 'x'],
        shape: [2, 2],
        eastward: new Float32Array(4),
        northward: new Float32Array(4),
        valid: new Uint8Array(4).fill(valid)
      },
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.5, 0.5]),
      tolerance: 1e-5,
      lifetime: 0.1,
      maximumTimeStep: 0.1,
      scheduling: 'active',
      dispatchesPerReadback: 4
    });
    try {
      const result = await tracer.advance(0.2);
      expect(result.complete).toBe(true);
      expect(result.active).toBe(0);
      expect(result.expired).toBe(valid);
      expect(result.missingData).toBe(1 - valid);
      expect(result.scheduledParticles).toBe(1);
      expect(result.integrationWorkgroups).toBe(1);
      expect(result.acceptedSteps).toBe(valid);
      const next = await tracer.advance(0.2);
      expect(next.scheduledParticles).toBe(0);
      expect(next.integrationWorkgroups).toBe(0);
      expect(next.expired).toBe(valid);
      expect(next.missingData).toBe(1 - valid);
    } finally {
      tracer.destroy();
    }
  }
});

it('active scheduling rebuilds work across temporal C-grid snapshots and periodic seams', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const makeInput = (speed: number) => ({
    layout: 'c-grid' as const,
    shape: [1, 1] as const,
    eastward: new Float32Array([speed, speed]),
    northward: new Float32Array(2),
    eastwardValid: new Uint8Array([1, 1]),
    northwardValid: new Uint8Array([1, 1])
  });
  const outputs: number[][] = [];
  for (const scheduling of ['dense', 'active', 'persistent'] as const) {
    const tracer = new ScientificFlowTracer(device, {
      input: makeInput(0.1),
      nextInput: makeInput(0.3),
      timeRange: [0, 1],
      bounds: [0, 0, 1, 1],
      periodicLongitude: true,
      conservativeMask: true,
      positions: new Float32Array([0.95, 0.5, 0.3, 0.4]),
      tolerance: 1e-5,
      maximumTimeStep: 0.1,
      maximumAttempts: 1,
      dispatchesPerReadback: 4,
      scheduling
    });
    try {
      let result = await tracer.advance(1);
      while (!result.complete) result = await tracer.continue();
      tracer.setNextSnapshot(makeInput(0.5), 2);
      result = await tracer.advance(1);
      while (!result.complete) result = await tracer.continue();
      expect(result.active).toBe(2);
      expect(result.pending).toBe(0);
      const bytes = await tracer.output.readAsync();
      const values = Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 8));
      expect(values[0]).toBeCloseTo(0.55, 5);
      expect(values[4]).toBeCloseTo(0.9, 5);
      outputs.push(values);
    } finally {
      tracer.destroy();
    }
  }
  expect(outputs[1]).toEqual(outputs[0]);
  expect(outputs[2]).toEqual(outputs[0]);
});

it('persistent survivors retain expiration totals and pre-call state across empty continuation tails', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const tracer = new ScientificFlowTracer(device, {
    input: {
      dimensions: ['y', 'x'],
      shape: [2, 2],
      eastward: new Float32Array(4).fill(0.1),
      northward: new Float32Array(4),
      valid: new Uint8Array(4).fill(1)
    },
    bounds: [0, 0, 1, 1],
    positions: new Float32Array([0.2, 0.5, -0.1, 0.5]),
    tolerance: 1e-5,
    maximumTimeStep: 0.01,
    maximumAttempts: 1,
    lifetime: 0.025,
    scheduling: 'persistent',
    dispatchesPerReadback: 3
  });
  try {
    let result = await tracer.advance(0.1);
    while (!result.complete) result = await tracer.continue();
    expect(result.expired).toBe(1);
    expect(result.outsideDomain).toBe(1);
    expect(result.active).toBe(0);
    const bytes = await tracer.output.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
    expect(values[2]).toBeCloseTo(0.025, 7);
    const next = await tracer.advance(0.1);
    expect(next.expired).toBe(1);
    expect(next.outsideDomain).toBe(1);
    expect(next.scheduledParticles).toBe(0);
    expect(next.integrationWorkgroups).toBe(0);
    expect(Array.from(await tracer.previous.readAsync())).toEqual(Array.from(bytes));
  } finally {
    tracer.destroy();
  }
});
