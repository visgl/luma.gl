// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Deterministic starting cloud: 32 bytes per particle, matching compiler reflection. */
export function makeParticles(count: number): Float32Array {
  const values = new Float32Array(count * 8);
  for (let index = 0; index < count; index++) {
    const phase = index * 2.399963229728653;
    const radius = 0.12 + Math.sqrt((index + 0.5) / count) * 0.8;
    const horizontal = Math.cos(phase) * radius;
    const vertical = Math.sin(phase) * radius;
    values.set(
      [
        horizontal,
        vertical,
        Math.sin(index * 0.17) * 0.12,
        index / count,
        -vertical * 0.6,
        horizontal * 0.6,
        0,
        0.5
      ],
      index * 8
    );
  }
  return values;
}

/** Independent CPU reference for one simulation step, used by the GPU test. */
export function simulateParticles(
  values: Float32Array,
  time: number,
  delta: number,
  swirl = 0.8,
  cohesion = 0.08
): Float32Array {
  const output = new Float32Array(values.length);
  for (let tile = 0; tile < values.length / 8; tile += 64) {
    const center = [0, 0, 0];
    let moving = 0;
    for (let index = tile; index < tile + 64; index++) {
      const offset = index * 8;
      for (let component = 0; component < 3; component++)
        center[component] += values[offset + component] / 64;
      if (Math.hypot(...values.slice(offset + 4, offset + 7)) > 0.15) moving++;
    }
    for (let index = tile; index < tile + 64; index++) {
      const offset = index * 8;
      const [horizontal, vertical, depth] = values.slice(offset, offset + 3);
      const radius = Math.hypot(horizontal, vertical);
      const targetRadius = 0.2 + values[offset + 3] * 0.6;
      const desired = [-vertical * swirl, horizontal * swirl, 0];
      const radial = [
        horizontal * (targetRadius - radius) * 1.5,
        vertical * (targetRadius - radius) * 1.5,
        -depth * 0.6
      ];
      const turbulence = [vertical * 5, horizontal * 4, horizontal * 3];
      output.set(values.slice(offset, offset + 8), offset);
      for (let component = 0; component < 3; component++) {
        const acceleration =
          (desired[component] - values[offset + 4 + component]) * 1.2 +
          radial[component] +
          (center[component] - values[offset + component]) * cohesion +
          Math.sin(turbulence[component] + time * 0.3) * 0.12;
        const velocity = values[offset + 4 + component] + acceleration * delta;
        output[offset + 4 + component] = velocity;
        output[offset + component] = values[offset + component] + velocity * delta;
      }
      output[offset + 7] = moving / 64;
    }
  }
  return output;
}
