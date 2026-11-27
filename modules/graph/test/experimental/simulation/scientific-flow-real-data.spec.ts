// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {
  ScientificFlowTracer,
  FlowTrajectoryHistory,
  type ScientificVectorFieldInput
} from '@luma.gl/graph/experimental-simulation';
import fixture from './fixtures/gfs-atlantic.json';

/** Upload the archived, quantized GFS values without reinterpreting their geographic units. */
function makeSnapshot(index: number): ScientificVectorFieldInput {
  return {
    dimensions: ['latitude', 'longitude'],
    shape: [fixture.shape[0], fixture.shape[1]],
    eastward: Float32Array.from(fixture.snapshots[index].eastward),
    northward: Float32Array.from(fixture.snapshots[index].northward),
    valid: new Uint8Array(fixture.shape[0] * fixture.shape[1]).fill(1),
    geographic: {
      longitudeStart: fixture.bounds[0],
      latitudeStart: fixture.bounds[1],
      longitudeStep: 1,
      latitudeStep: 1
    }
  };
}

it('qualifies six-hour GFS trajectories against an independent refined CPU reference', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  expect(fixture.reference.maximumReferenceDifferenceMetres).toBeLessThan(0.01);
  const [west, south, east, north] = fixture.bounds;
  const tracer = new ScientificFlowTracer(device, {
    input: makeSnapshot(0),
    nextInput: makeSnapshot(1),
    timeRange: [0, 21600],
    positions: Float32Array.from(
      fixture.seeds.flatMap(([longitude, latitude]) => [
        (longitude - west) / (east - west),
        (latitude - south) / (north - south)
      ])
    ),
    tolerance: 1,
    maximumTimeStep: 300,
    maximumAttempts: 2,
    conservativeMask: true
  });
  const history = new FlowTrajectoryHistory(device, {
    particleCount: tracer.particleCount,
    capacity: 7
  });
  /** Capture immediately after submission, before the next horizon changes particle storage. */
  function capture(): void {
    const encoder = device.createCommandEncoder();
    history.record(encoder, tracer.output, tracer.time);
    device.submit(encoder.finish());
  }
  try {
    capture();
    for (let hour = 1; hour <= 6; hour++) {
      let result = await tracer.advance(3600);
      for (let dispatch = 0; !result.complete && dispatch < 100; dispatch++)
        result = await tracer.continue();
      expect(result.complete).toBe(true);
      expect(result.active).toBe(4);
      expect(tracer.time).toBe(hour * 3600);
      capture();
    }
    const frames = await history.readFrames();
    expect(frames.length).toBe(fixture.reference.frames.length);
    let maximumErrorMetres = 0;
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
      const frame = frames[frameIndex];
      const reference = fixture.reference.frames[frameIndex];
      expect(frame.time).toBe(reference.time);
      for (let particle = 0; particle < tracer.particleCount; particle++) {
        const longitude = west + frame.particles[particle * 4] * (east - west);
        const latitude = south + frame.particles[particle * 4 + 1] * (north - south);
        const expected = reference.positions[particle];
        const errorMetres =
          (Math.hypot(
            (longitude - expected[0]) * Math.cos((expected[1] * Math.PI) / 180),
            latitude - expected[1]
          ) *
            6371008.8 *
            Math.PI) /
          180;
        maximumErrorMetres = Math.max(maximumErrorMetres, errorMetres);
        expect(frame.particles[particle * 4 + 2]).toBe(frame.time);
        expect(frame.particles[particle * 4 + 3]).toBe(1);
      }
    }
    expect(maximumErrorMetres).toBeLessThan(5);
  } finally {
    history.destroy();
    tracer.destroy();
  }
});
