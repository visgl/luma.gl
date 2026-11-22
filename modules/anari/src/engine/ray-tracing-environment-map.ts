// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {ANARIRayTracingEnvironmentMap} from '../anari-types';

/** The environment shares the existing storage binding with analytic and emissive geometry lights. */
export const RAY_LIGHT_FLOAT_COUNT = 16;

const environmentDistributions = new WeakMap<ANARIRayTracingEnvironmentMap, Float32Array>();

/** Pack piecewise-constant texel radiance, solid-angle PDF and the cumulative texel probability. */
export function getEnvironmentMapDistribution(map: ANARIRayTracingEnvironmentMap): Float32Array {
  const cached = environmentDistributions.get(map);
  if (cached) return cached;
  const {width, height, data} = map;
  const texelCount = width * height;
  // Keep the table below 64 MiB and texel indices exactly representable in the shader.
  assert(
    Number.isInteger(width) &&
      Number.isInteger(height) &&
      width > 0 &&
      height > 0 &&
      width <= 2048 &&
      height <= 2048 &&
      texelCount <= 1024 * 1024 &&
      data.length === texelCount * 3
  );
  const packed = new Float32Array(texelCount * RAY_LIGHT_FLOAT_COUNT);
  const rowSolidAngles = Array.from(
    {length: height},
    (_, row) =>
      ((2 * Math.PI) / width) *
      (Math.cos((Math.PI * row) / height) - Math.cos((Math.PI * (row + 1)) / height))
  );
  let totalPower = 0;
  for (let index = 0; index < texelCount; index++) {
    const offset = index * RAY_LIGHT_FLOAT_COUNT;
    for (let channel = 0; channel < 3; channel++) {
      const radiance = Math.fround(data[index * 3 + channel]);
      packed[offset + channel] = Number.isFinite(radiance) ? Math.max(0, radiance) : 0;
    }
    totalPower += getLuminance(packed, offset) * rowSolidAngles[Math.floor(index / width)];
  }

  let previousCumulative = 0;
  let cumulative = 0;
  for (let index = 0; index < texelCount; index++) {
    const offset = index * RAY_LIGHT_FLOAT_COUNT;
    const solidAngle = rowSolidAngles[Math.floor(index / width)];
    const uniformProbability = solidAngle / (4 * Math.PI);
    cumulative +=
      totalPower > 0
        ? (getLuminance(packed, offset) * solidAngle) / totalPower
        : uniformProbability;
    const storedCumulative = index === texelCount - 1 ? 1 : Math.fround(Math.min(cumulative, 1));
    packed[offset + 3] = (storedCumulative - previousCumulative) / solidAngle;
    packed[offset + 4] = storedCumulative;
    previousCumulative = storedCumulative;
  }
  environmentDistributions.set(map, packed);
  return packed;
}

function getLuminance(data: Float32Array, offset: number): number {
  return 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
}
