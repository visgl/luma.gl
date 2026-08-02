// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeferredPointLight} from '@luma.gl/experimental';
import type {Matrix4} from '@math.gl/core';
import {LIGHTSTORM_GRID_SPACING} from './lightstorm-data';

export const LIGHTSTORM_POINT_LIGHT_COUNT = 128;
export const LIGHTSTORM_LIGHT_MARKER_WORD_COUNT = 12;

const LIGHTSTORM_LIGHT_COLORS = [
  [0.12, 0.78, 1],
  [1, 0.46, 0.1],
  [0.94, 0.18, 0.78]
] as const;
const LIGHT_COLUMN_COUNT = 16;
const LIGHT_ALONG_STREET_CELL_STRIDE = 4;
const LIGHT_CURB_OFFSET = LIGHTSTORM_GRID_SPACING * 0.375;
const DEFAULT_CITY_GRID_SIZE = 500;

/** One deterministic world-space light placed along the central street lattice. */
export type LightstormPointLight = {
  worldPosition: [number, number, number];
  range: number;
  color: [number, number, number];
  intensity: number;
  pulsePhase: number;
  pulseFrequency: number;
};

/** Packs world-space point-light metadata for the visible emissive source markers. */
export function makeLightstormLightMarkerBufferData(
  lights: readonly LightstormPointLight[]
): Float32Array {
  const data = new Float32Array(lights.length * LIGHTSTORM_LIGHT_MARKER_WORD_COUNT);
  for (let lightIndex = 0; lightIndex < lights.length; lightIndex++) {
    const light = lights[lightIndex]!;
    const wordOffset = lightIndex * LIGHTSTORM_LIGHT_MARKER_WORD_COUNT;
    data.set(
      [
        light.worldPosition[0],
        light.worldPosition[1],
        light.worldPosition[2],
        light.range,
        light.color[0],
        light.color[1],
        light.color[2],
        light.intensity,
        light.pulsePhase,
        light.pulseFrequency,
        0,
        0
      ],
      wordOffset
    );
  }
  return data;
}

/** Creates a deterministic cyan, amber, and magenta street-light lattice. */
export function makeLightstormPointLights(
  count: number = LIGHTSTORM_POINT_LIGHT_COUNT,
  cityGridSize: number = DEFAULT_CITY_GRID_SIZE
): LightstormPointLight[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('Lightstorm point-light count must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(cityGridSize) || cityGridSize < 1) {
    throw new Error('Lightstorm city grid size must be a positive safe integer');
  }
  if (count === 0) {
    return [];
  }

  const columnCount = Math.min(LIGHT_COLUMN_COUNT, count);
  const cityCenterGridIndex = (cityGridSize - 1) / 2;
  const transitCorridors = getCentralTransitCorridors(cityGridSize);
  const lights: LightstormPointLight[] = [];

  for (let lightIndex = 0; lightIndex < count; lightIndex++) {
    const corridor = Math.floor(lightIndex / columnCount);
    const column = lightIndex % columnCount;
    const lightsInCorridor = Math.min(columnCount, count - corridor * columnCount);
    const proposedAlongStreetGridIndex = Math.max(
      0,
      Math.min(
        cityGridSize - 1,
        Math.round(
          cityCenterGridIndex +
            (column - (lightsInCorridor - 1) / 2) * LIGHT_ALONG_STREET_CELL_STRIDE
        )
      )
    );
    const alongStreetGridIndex = getNearestNonTransitGridIndex(
      proposedAlongStreetGridIndex,
      cityGridSize
    );
    const corridorGridIndex = transitCorridors[corridor % transitCorridors.length]!;
    const alongStreetPosition =
      (alongStreetGridIndex - cityCenterGridIndex) * LIGHTSTORM_GRID_SPACING;
    const corridorPosition = (corridorGridIndex - cityCenterGridIndex) * LIGHTSTORM_GRID_SPACING;
    const curbOffset = corridorGridIndex % 12 === 0 ? -LIGHT_CURB_OFFSET : LIGHT_CURB_OFFSET;
    const followsEastWestStreet = corridor % 2 === 0;
    const color = LIGHTSTORM_LIGHT_COLORS[lightIndex % LIGHTSTORM_LIGHT_COLORS.length]!;

    lights.push({
      worldPosition: [
        followsEastWestStreet ? alongStreetPosition : corridorPosition + curbOffset,
        3.5 + getDeterministicFraction(lightIndex, 0) * 2.5,
        followsEastWestStreet ? corridorPosition + curbOffset : alongStreetPosition
      ],
      // Keep the brighter pools local so the pavement remains dark between fixtures.
      range: 16 + getDeterministicFraction(lightIndex, 1) * 8,
      color: [color[0], color[1], color[2]],
      intensity: 14 + getDeterministicFraction(lightIndex, 2) * 10,
      pulsePhase: getDeterministicFraction(lightIndex, 3) * Math.PI * 2,
      pulseFrequency: 0.45 + getDeterministicFraction(lightIndex, 4) * 0.7
    });
  }

  return lights;
}

/** Transforms world lights into view space and applies subtle deterministic intensity pulses. */
export function makeLightstormViewPointLights(
  lights: readonly LightstormPointLight[],
  viewMatrix: Matrix4,
  timeSeconds: number,
  animate: boolean = true
): DeferredPointLight[] {
  const finiteTimeSeconds = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  return lights.map(light => {
    const viewPosition = viewMatrix.transformAsPoint(light.worldPosition) as [
      number,
      number,
      number
    ];
    const pulse = animate
      ? 1 + Math.sin(light.pulsePhase + finiteTimeSeconds * light.pulseFrequency) * 0.07
      : 1;
    return {
      position: [viewPosition[0], viewPosition[1], viewPosition[2]],
      range: light.range,
      color: [light.color[0], light.color[1], light.color[2]],
      intensity: Math.max(0, light.intensity * pulse)
    };
  });
}

function getCentralTransitCorridors(cityGridSize: number): number[] {
  const centerGridIndex = (cityGridSize - 1) / 2;
  const corridors: number[] = [];
  for (let gridIndex = 0; gridIndex < cityGridSize; gridIndex++) {
    if (gridIndex % 12 <= 1) {
      corridors.push(gridIndex);
    }
  }
  corridors.sort(
    (left, right) =>
      Math.abs(left - centerGridIndex) - Math.abs(right - centerGridIndex) || left - right
  );
  return corridors.length > 0 ? corridors : [Math.round(centerGridIndex)];
}

function getNearestNonTransitGridIndex(gridIndex: number, cityGridSize: number): number {
  for (let distance = 0; distance < 12; distance++) {
    const lowerGridIndex = gridIndex - distance;
    if (lowerGridIndex >= 0 && lowerGridIndex % 12 > 1) {
      return lowerGridIndex;
    }
    const upperGridIndex = gridIndex + distance;
    if (upperGridIndex < cityGridSize && upperGridIndex % 12 > 1) {
      return upperGridIndex;
    }
  }
  return gridIndex;
}

function getDeterministicFraction(lightIndex: number, sequenceIndex: number): number {
  let value = Math.imul(lightIndex + 1, 0x45d9f3b) ^ Math.imul(sequenceIndex + 1, 0x27d4eb2d);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}
