// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {
  FlowTrajectorySnapshot,
  ScientificVectorFieldInput
} from '@luma.gl/graph/experimental-simulation';
import fixture from '../../../modules/graph/test/experimental/simulation/fixtures/gfs-atlantic.json';

/** Pinned quantized model winds and independently refined CPU trajectories. */
export const GFS_FIXTURE = fixture;
/** Six physical hours, with no extrapolation beyond the two archived snapshots. */
export const GFS_DURATION = 21600;
/** Stable colors for the four qualification releases. */
export const GFS_COLORS = ['#7ef5db', '#ffbc72', '#c0a0ff', '#ff7ca8'];

/** Preserve geographic units while optionally decimating the original regular grid. */
export function makeGfsField(snapshot: number, stride = 1): ScientificVectorFieldInput {
  const size = 30 / stride + 1;
  const eastward = new Float32Array(size * size);
  const northward = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const source = row * stride * 31 + column * stride;
      eastward[row * size + column] = fixture.snapshots[snapshot].eastward[source];
      northward[row * size + column] = fixture.snapshots[snapshot].northward[source];
    }
  }
  return {
    dimensions: ['latitude', 'longitude'],
    shape: [size, size],
    eastward,
    northward,
    valid: new Uint8Array(size * size).fill(1),
    geographic: {
      longitudeStart: -85,
      latitudeStart: 20,
      longitudeStep: stride,
      latitudeStep: stride
    }
  };
}

/** Keep qualification particles first; append an interior visual release, away from the regional boundary. */
export function makeGfsSeeds(side = 0): Float32Array {
  const positions = fixture.seeds.flatMap(([longitude, latitude]) => [
    (longitude + 85) / 30,
    (latitude - 20) / 30
  ]);
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++)
      positions.push(0.2 + (0.6 * (column + 0.5)) / side, 0.2 + (0.6 * (row + 0.5)) / side);
  }
  return Float32Array.from(positions);
}

/** Tangent-plane separation in metres, matching the pinned qualification metric. */
export function measureGfsError(horizontal: number, vertical: number, expected: number[]): number {
  const longitude = -85 + 30 * horizontal;
  const latitude = 20 + 30 * vertical;
  return (
    (Math.hypot(
      (longitude - expected[0]) * Math.cos((expected[1] * Math.PI) / 180),
      latitude - expected[1]
    ) *
      6371008.8 *
      Math.PI) /
    180
  );
}

/** Compare only common hourly horizons, never linearly interpolated reference positions. */
export function measureGfsFrames(frames: FlowTrajectorySnapshot[]): number[] {
  const errors = [0, 0, 0, 0];
  for (const frame of frames) {
    const reference = fixture.reference.frames.find(candidate => candidate.time === frame.time);
    if (!reference) continue;
    for (let particle = 0; particle < 4; particle++) {
      errors[particle] = Math.max(
        errors[particle],
        measureGfsError(
          frame.particles[particle * 4],
          frame.particles[particle * 4 + 1],
          reference.positions[particle]
        )
      );
    }
  }
  return errors;
}
