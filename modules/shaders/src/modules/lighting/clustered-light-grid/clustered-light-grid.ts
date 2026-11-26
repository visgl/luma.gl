// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

/** Renderer-independent lookup for top-left normalized screen coordinates and positive view depth. */
export const clusteredLightGrid = {
  name: 'clusteredLightGrid',
  source: /* wgsl */ `
fn clusteredLightGrid_getIndex(coordinates: vec2f, viewDepth: f32, dimensions: vec3u, nearPlane: f32, farPlane: f32) -> u32 {
  let tile = min(vec2u(clamp(coordinates, vec2f(0.0), vec2f(0.999999)) * vec2f(dimensions.xy)), dimensions.xy - vec2u(1));
  let normalizedDepth = clamp(log(clamp(viewDepth, nearPlane, farPlane) / nearPlane) / log(farPlane / nearPlane), 0.0, 0.999999);
  let depthSlice = min(u32(normalizedDepth * f32(dimensions.z)), dimensions.z - 1u);
  return (depthSlice * dimensions.y + tile.y) * dimensions.x + tile.x;
}
`
} as const satisfies ShaderModule;
