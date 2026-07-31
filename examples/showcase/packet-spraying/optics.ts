// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Vector3} from './network';

export type StudioEnvironmentMipLevel = {
  height: number;
  pixels: Uint8Array;
  width: number;
};

const STUDIO_LIGHTS = [
  {direction: [-0.58, 0.64, 0.5], color: [1, 0.92, 0.78], width: 0.11},
  {direction: [0.72, 0.24, -0.58], color: [0.35, 0.62, 1], width: 0.16},
  {direction: [0.05, 0.94, 0.33], color: [0.78, 0.88, 1], width: 0.085},
  {direction: [-0.8, -0.12, -0.58], color: [0.42, 0.35, 0.8], width: 0.2}
];

/** Builds a deterministic equirectangular studio probe and its complete roughness mip pyramid. */
export function makeStudioEnvironmentMipLevels(
  width = 256,
  height = 128
): StudioEnvironmentMipLevel[] {
  const pixels = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row++) {
    const elevation = (row / Math.max(height - 1, 1)) * Math.PI;
    for (let column = 0; column < width; column++) {
      const azimuth = (column / Math.max(width - 1, 1) - 0.5) * Math.PI * 2;
      const direction: Vector3 = [
        Math.cos(azimuth) * Math.sin(elevation),
        Math.cos(elevation),
        Math.sin(azimuth) * Math.sin(elevation)
      ];
      const horizon = Math.pow(1 - Math.abs(direction[1]), 8);
      const sky = Math.max(direction[1], 0);
      const color: Vector3 = [
        0.035 + sky * 0.065 + horizon * 0.09,
        0.045 + sky * 0.085 + horizon * 0.12,
        0.075 + sky * 0.16 + horizon * 0.19
      ];

      for (const light of STUDIO_LIGHTS) {
        const alignment = Math.max(
          direction[0] * light.direction[0] +
            direction[1] * light.direction[1] +
            direction[2] * light.direction[2],
          0
        );
        const intensity = Math.pow(alignment, 1 / light.width ** 2);
        color[0] += light.color[0] * intensity * 0.78;
        color[1] += light.color[1] * intensity * 0.78;
        color[2] += light.color[2] * intensity * 0.78;
      }

      const pixelOffset = (row * width + column) * 4;
      pixels[pixelOffset] = Math.round(Math.min(color[0], 1) * 255);
      pixels[pixelOffset + 1] = Math.round(Math.min(color[1], 1) * 255);
      pixels[pixelOffset + 2] = Math.round(Math.min(color[2], 1) * 255);
      pixels[pixelOffset + 3] = 255;
    }
  }

  const levels: StudioEnvironmentMipLevel[] = [{height, pixels, width}];
  while (width > 1 || height > 1) {
    const previousLevel = levels[levels.length - 1];
    width = Math.max(1, Math.floor(width / 2));
    height = Math.max(1, Math.floor(height / 2));
    const levelPixels = new Uint8Array(width * height * 4);

    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        for (let channel = 0; channel < 4; channel++) {
          let accumulatedValue = 0;
          for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
            const sourceRow = Math.min(row * 2 + rowOffset, previousLevel.height - 1);
            for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
              const sourceColumn = (column * 2 + columnOffset) % previousLevel.width;
              accumulatedValue +=
                previousLevel.pixels[
                  (sourceRow * previousLevel.width + sourceColumn) * 4 + channel
                ];
            }
          }
          levelPixels[(row * width + column) * 4 + channel] = Math.round(accumulatedValue / 4);
        }
      }
    }

    levels.push({height, pixels: levelPixels, width});
  }

  return levels;
}
