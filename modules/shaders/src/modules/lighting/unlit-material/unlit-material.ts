// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

const SOURCE_WGSL = /* wgsl */ `\
fn unlitMaterial_getColor(surfaceColor: vec4<f32>) -> vec4<f32> {
  return surfaceColor;
}

// Compatibility with the aggregate Phong/Gouraud material evaluation function.
fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, positionWorldspace: vec3<f32>, normalWorldspace: vec3<f32>) -> vec3<f32> {
  return surfaceColor;
}
`;

const SOURCE_GLSL = /* glsl */ `\
vec4 unlitMaterial_getColor(vec4 surfaceColor) {
  return surfaceColor;
}

// Compatibility with the aggregate Phong/Gouraud material evaluation function.
vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 positionWorldspace, vec3 normalWorldspace) {
  return surfaceColor;
}
`;

/**
 * Preserves surface RGBA without lighting dependencies, uniforms, or bindings.
 * Use instead of a lit material module when lighting is never needed. The caller
 * supplies color/texture sampling and remains responsible for output color space
 * and alpha conventions. Available in both vertex and fragment stages.
 */
export const unlitMaterial: ShaderModule<Record<string, never>> = {
  name: 'unlitMaterial',
  source: SOURCE_WGSL,
  vs: SOURCE_GLSL,
  fs: SOURCE_GLSL,
  dependencies: [],
  bindingLayout: [],
  uniformTypes: {},
  defaultUniforms: {}
};
