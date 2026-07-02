// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const INSTANCE_WORD_COUNT = 8;

/** Creates deterministic position, radius, and color records for the culling field. */
export function makeCullingInstances(instanceCount: number): Float32Array {
  const instances = new Float32Array(instanceCount * INSTANCE_WORD_COUNT);
  let randomState = 0x6d2b79f5;
  const random = (): number => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 0x100000000;
  };

  for (let index = 0; index < instanceCount; index++) {
    const wordOffset = index * INSTANCE_WORD_COUNT;
    const x = (random() * 2 - 1) * 220;
    const z = (random() * 2 - 1) * 220;
    const terrainHeight = Math.sin(x * 0.035) * 5 + Math.cos(z * 0.045) * 4;
    const radius = 0.35 + Math.pow(random(), 2) * 1.4;
    const y = terrainHeight + radius + Math.pow(random(), 4) * 22;
    const heightMix = Math.min(1, Math.max(0, (y + 8) / 38));
    const radialMix = Math.min(1, Math.hypot(x, z) / 310);

    instances[wordOffset] = x;
    instances[wordOffset + 1] = y;
    instances[wordOffset + 2] = z;
    instances[wordOffset + 3] = radius;
    instances[wordOffset + 4] = 0.12 + heightMix * 0.28;
    instances[wordOffset + 5] = 0.46 + (1 - radialMix) * 0.38;
    instances[wordOffset + 6] = 0.64 + radialMix * 0.32;
    instances[wordOffset + 7] = 1;
  }

  return instances;
}
