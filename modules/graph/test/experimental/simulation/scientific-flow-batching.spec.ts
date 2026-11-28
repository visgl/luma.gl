// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {ScientificFlowTracer} from '../../../src/experimental/simulation/index';

for (const dispatchesPerReadback of [1, 4, 16]) {
  it(`qualifies ${dispatchesPerReadback}-dispatch RK45 batches with stable slots and aggregate work`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const input = {
      dimensions: ['y', 'x'] as const,
      shape: [3, 3] as const,
      eastward: new Float32Array(9).fill(0.2),
      northward: new Float32Array(9),
      valid: new Uint8Array(9).fill(1)
    };
    const tracer = new ScientificFlowTracer(device, {
      input,
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.1, 0.5, 0.4, 0.4, -0.1, 0.5]),
      tolerance: 1e-5,
      minimumTimeStep: 0.01,
      maximumTimeStep: 0.05,
      maximumAttempts: 1,
      dispatchesPerReadback
    });
    try {
      let result = await tracer.advance(0.5);
      let accepted = result.acceptedSteps;
      let rejected = result.rejectedSteps;
      let calls = 1;
      while (!result.complete && calls < 20) {
        expect(tracer.time).toBe(0);
        result = await tracer.continue();
        accepted += result.acceptedSteps;
        rejected += result.rejectedSteps;
        calls++;
      }
      expect(result.complete).toBe(true);
      expect(result.active).toBe(2);
      expect(result.outsideDomain).toBe(1);
      expect(result.pending).toBe(0);
      expect(accepted).toBe(20);
      expect(rejected).toBe(0);
      expect(calls).toBe(Math.ceil(10 / dispatchesPerReadback));
      expect(result.dispatchCount).toBe(dispatchesPerReadback);
      expect(result.dispatchIndex).toBe(calls * dispatchesPerReadback);
      expect(result.counterReadbackBytes).toBe(36 * dispatchesPerReadback);
      expect(result.encodings).toHaveLength(dispatchesPerReadback);
      expect(result.encoding).toBe(result.encodings.at(-1));
      const bytes = await tracer.output.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, 12);
      expect(values[0]).toBeCloseTo(0.2, 5);
      expect(values[4]).toBeCloseTo(0.5, 5);
      expect(values[8]).toBeCloseTo(-0.1, 5);
      expect(tracer.time).toBe(0.5);
      if (dispatchesPerReadback === 16) {
        const previousBytes = await tracer.previous.readAsync();
        expect(new Float32Array(previousBytes.buffer, previousBytes.byteOffset, 12)[0]).toBeCloseTo(
          0.1,
          6
        );
      }
      // A new horizon resets progress only on the first dispatch, not every dispatch.
      result = await tracer.advance(0.1);
      while (!result.complete) result = await tracer.continue();
      expect(tracer.time).toBeCloseTo(0.6, 12);
    } finally {
      tracer.destroy();
    }
  });
}

it('validates the dispatch batch budget before allocating resources', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  for (const dispatchesPerReadback of [0, 33, 1.5, NaN]) {
    expect(
      () =>
        new ScientificFlowTracer(device, {
          input: {
            dimensions: ['y', 'x'],
            shape: [2, 2],
            eastward: new Float32Array(4),
            northward: new Float32Array(4),
            valid: new Uint8Array(4).fill(1)
          },
          bounds: [0, 0, 1, 1],
          positions: new Float32Array([0.5, 0.5]),
          tolerance: 1e-5,
          dispatchesPerReadback
        })
    ).toThrow();
  }
});

it('batching preserves adaptive rejections and mixed-particle completion', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const reports: {accepted: number; rejected: number; values: number[]}[] = [];
  for (const dispatchesPerReadback of [1, 8]) {
    const tracer = new ScientificFlowTracer(device, {
      input: {
        dimensions: ['y', 'x'],
        shape: [2, 2],
        eastward: new Float32Array([2, 2, -2, -2]),
        northward: new Float32Array([-2, 2, -2, 2]),
        valid: new Uint8Array(4).fill(1)
      },
      bounds: [0, 0, 1, 1],
      positions: new Float32Array([0.75, 0.5, 0.6, 0.5, -0.1, 0.5]),
      tolerance: 1e-6,
      minimumTimeStep: 1e-5,
      maximumTimeStep: 0.25,
      maximumAttempts: 2,
      dispatchesPerReadback
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
      expect(result.active).toBe(2);
      expect(result.outsideDomain).toBe(1);
      expect(rejected).toBeGreaterThan(0);
      const bytes = await tracer.output.readAsync();
      const values = Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 12));
      expect(
        Math.hypot(values[0] - (0.5 + 0.25 * Math.cos(2)), values[1] - (0.5 + 0.25 * Math.sin(2)))
      ).toBeLessThan(0.00001);
      reports.push({accepted, rejected, values});
    } finally {
      tracer.destroy();
    }
  }
  expect(reports[1]).toEqual(reports[0]);
});
