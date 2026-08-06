// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SplatSource} from '@luma.gl/splats';

export const GAUSSIAN_SPLAT_BATCH_COUNT = 4;
export const GAUSSIAN_SPLATS_PER_BATCH = 1536;

type Color = readonly [number, number, number];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BATCH_COLOR_PALETTES: ReadonlyArray<readonly [Color, Color]> = [
  [
    [255, 111, 73],
    [255, 201, 110]
  ],
  [
    [59, 136, 255],
    [84, 246, 226]
  ],
  [
    [198, 83, 255],
    [255, 124, 180]
  ],
  [
    [112, 213, 255],
    [255, 229, 159]
  ]
];

/** Builds one deterministic source batch without combining or repacking earlier batches. */
export function makeGaussianSplatSource(
  sourceBatchIndex: number,
  splatCount = GAUSSIAN_SPLATS_PER_BATCH
): SplatSource {
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 4);
  const opacities = new Float32Array(splatCount);
  const random = makeRandomGenerator(0x9e3779b9 ^ ((sourceBatchIndex + 1) * 0x85ebca6b));
  const [startColor, endColor] =
    BATCH_COLOR_PALETTES[sourceBatchIndex % BATCH_COLOR_PALETTES.length];

  for (let splatIndex = 0; splatIndex < splatCount; splatIndex++) {
    const progress = (splatIndex + 0.5) / splatCount;
    const jitterX = random() - 0.5;
    const jitterY = random() - 0.5;
    const jitterZ = random() - 0.5;
    const colorProgress = random() * 0.58 + progress * 0.42;
    const positionOffset = splatIndex * 3;
    const colorOffset = splatIndex * 4;

    writeSplatPosition(
      positions,
      positionOffset,
      sourceBatchIndex,
      splatIndex,
      progress,
      jitterX,
      jitterY,
      jitterZ
    );

    scales[positionOffset] = 0.042 + random() * 0.07;
    scales[positionOffset + 1] = 0.016 + random() * 0.025;
    scales[positionOffset + 2] = 0.018 + random() * 0.035;

    const rotationAngle = progress * Math.PI * (sourceBatchIndex + 2) + random() * Math.PI;
    const halfAngle = rotationAngle * 0.5;
    const axisY = 0.28 + random() * 0.55;
    const axisZ = Math.sqrt(1 - axisY * axisY);
    rotations[colorOffset] = Math.cos(halfAngle);
    rotations[colorOffset + 1] = 0;
    rotations[colorOffset + 2] = Math.sin(halfAngle) * axisY;
    rotations[colorOffset + 3] = Math.sin(halfAngle) * axisZ;

    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      colors[colorOffset + channelIndex] = Math.round(
        startColor[channelIndex] +
          (endColor[channelIndex] - startColor[channelIndex]) * colorProgress
      );
    }
    colors[colorOffset + 3] = 255;
    opacities[splatIndex] = 0.32 + random() * 0.46;
  }

  return {
    positions,
    scales,
    rotations,
    colors,
    opacities,
    sourceBatchIndex,
    rowIndexBase: sourceBatchIndex * splatCount
  };
}

function writeSplatPosition(
  positions: Float32Array,
  positionOffset: number,
  sourceBatchIndex: number,
  splatIndex: number,
  progress: number,
  jitterX: number,
  jitterY: number,
  jitterZ: number
): void {
  switch (sourceBatchIndex % GAUSSIAN_SPLAT_BATCH_COUNT) {
    case 0: {
      const angle = progress * Math.PI * 12;
      const radius = 0.46 + progress * 1.78;
      positions[positionOffset] = Math.cos(angle) * radius + jitterX * 0.24;
      positions[positionOffset + 1] = Math.sin(angle * 0.5) * 0.48 + jitterY * 0.29;
      positions[positionOffset + 2] = Math.sin(angle) * radius * 0.65 + jitterZ * 0.24;
      break;
    }

    case 1: {
      const height = 1 - progress * 2;
      const radialDistance = Math.sqrt(Math.max(0, 1 - height * height));
      const longitude = splatIndex * GOLDEN_ANGLE;
      const radius = 2.36 + jitterX * 0.29;
      positions[positionOffset] = Math.cos(longitude) * radialDistance * radius;
      positions[positionOffset + 1] = height * radius * 0.74 + jitterY * 0.09;
      positions[positionOffset + 2] = Math.sin(longitude) * radialDistance * radius;
      break;
    }

    case 2: {
      const strandOffset = (splatIndex % 3) * ((Math.PI * 2) / 3);
      const angle = progress * Math.PI * 9 + strandOffset;
      const radius = 0.85 + Math.sin(progress * Math.PI) * 0.38;
      positions[positionOffset] = Math.cos(angle) * radius + jitterX * 0.18;
      positions[positionOffset + 1] = (progress - 0.5) * 3.75 + jitterY * 0.2;
      positions[positionOffset + 2] = Math.sin(angle) * radius + jitterZ * 0.18;
      break;
    }

    default: {
      const angle = progress * Math.PI * 2;
      const tubeAngle = splatIndex * GOLDEN_ANGLE;
      const majorRadius = 2.67 + Math.cos(tubeAngle) * 0.19;
      positions[positionOffset] = Math.cos(angle) * majorRadius + jitterX * 0.11;
      positions[positionOffset + 1] =
        Math.sin(angle * 2) * 0.26 + Math.sin(tubeAngle) * 0.19 + jitterY * 0.08;
      positions[positionOffset + 2] = Math.sin(angle) * majorRadius + jitterZ * 0.11;
    }
  }
}

function makeRandomGenerator(initialSeed: number): () => number {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
