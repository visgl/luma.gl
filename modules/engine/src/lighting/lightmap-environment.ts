// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

/** Linear RGB equirectangular radiance. Row zero is the north pole; longitude zero points +X. */
export type LightmapEnvironment = {width: number; height: number; data: Float32Array};
export type LightmapEnvironmentSample = {
  /** Direction from the surface toward the sampled environment, usable by shadow preparation. */
  directionToLight: [number, number, number];
  light: {
    type: 'directional';
    direction: [number, number, number];
    color: [number, number, number];
  };
};

/** Uniform solid-angle quadrature for a fixed sample budget. Use lighting.useByteColors=false. */
export function sampleLightmapEnvironment(
  environment: LightmapEnvironment,
  sampleIndex: number,
  sampleCount: number
): LightmapEnvironmentSample {
  assert(
    Number.isInteger(environment.width) &&
      environment.width > 0 &&
      Number.isInteger(environment.height) &&
      environment.height > 0
  );
  assert(environment.data.length === environment.width * environment.height * 3);
  assert(
    Number.isInteger(sampleCount) &&
      sampleCount > 0 &&
      Number.isInteger(sampleIndex) &&
      sampleIndex >= 0 &&
      sampleIndex < sampleCount
  );
  let reversed = 0;
  let fraction = 0.5;
  for (let remaining = sampleIndex; remaining > 0; remaining = Math.floor(remaining / 2)) {
    reversed += (remaining % 2) * fraction;
    fraction *= 0.5;
  }
  const vertical = 1 - (2 * (sampleIndex + 0.5)) / sampleCount;
  const longitude = 2 * Math.PI * reversed;
  const radius = Math.sqrt(Math.max(0, 1 - vertical * vertical));
  const directionToLight: [number, number, number] = [
    radius * Math.cos(longitude),
    vertical,
    radius * Math.sin(longitude)
  ];
  const column = Math.min(environment.width - 1, Math.floor(reversed * environment.width));
  const row = Math.min(
    environment.height - 1,
    Math.floor((Math.acos(vertical) / Math.PI) * environment.height)
  );
  const offset = (row * environment.width + column) * 3;
  return {
    directionToLight,
    light: {
      type: 'directional',
      direction: [-directionToLight[0], -directionToLight[1], -directionToLight[2]],
      color: [
        environment.data[offset] * 4 * Math.PI,
        environment.data[offset + 1] * 4 * Math.PI,
        environment.data[offset + 2] * 4 * Math.PI
      ]
    }
  };
}
