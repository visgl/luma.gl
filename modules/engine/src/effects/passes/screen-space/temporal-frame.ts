// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Projection jitter in top-left UV units, relative to the render resolution. */
export type TemporalJitter = [number, number];

/** Current and previous projection jitter for same-resolution temporal resolves. */
export type TemporalFrameJitter = {
  /** Current frame projection offset in top-left UV units at render resolution. */
  currentJitter: TemporalJitter;
  /** Previous frame projection offset in top-left UV units at render resolution. */
  previousJitter: TemporalJitter;
};

/**
 * Reprojects a current unjittered UV by subtracting the motion vector.
 * Motion is current unjittered UV minus previous unjittered UV.
 * Remove current projection jitter before calling and apply previous jitter
 * only if the sampled history is jittered.
 * @internal
 */
export const temporalMotionReprojectionWGSL = /* wgsl */ `
fn temporal_reprojectMotion(currentUv: vec2f, motion: vec2f) -> vec2f {
  return currentUv - motion;
}
`;

/** Per-frame jitter and reset controls shared by temporal resolves. */
export type TemporalFrame = TemporalFrameJitter & {
  /** Ignore retained data for the first frame, a camera cut, or a resize. */
  resetHistory?: boolean;
};
