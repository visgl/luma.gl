// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A bounded inward outline over exact, visible placement identifiers. */
export const SELECTION_OUTLINE_SHADER = /* wgsl */ `
struct OutlineUniforms {
  color: vec4<f32>,
  selectedIdentifier: u32,
  width: u32,
  viewportOrigin: vec2<i32>,
};
@group(0) @binding(0) var identifierImage: texture_2d<u32>;
@group(0) @binding(1) var<uniform> uniforms: OutlineUniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

fn loadIdentifier(pixel: vec2<i32>) -> u32 {
  let dimensions = vec2<i32>(textureDimensions(identifierImage));
  if (any(pixel < vec2<i32>(0)) || any(pixel >= dimensions)) { return 0u; }
  return textureLoad(identifierImage, pixel, 0).r;
}

@fragment
fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  let pixel = vec2<i32>(position.xy) - uniforms.viewportOrigin;
  if (uniforms.selectedIdentifier == 0u || loadIdentifier(pixel) != uniforms.selectedIdentifier) {
    discard;
  }
  for (var distance = 1; distance <= 8; distance++) {
    if (u32(distance) > uniforms.width) { break; }
    if (loadIdentifier(pixel + vec2<i32>(distance, 0)) != uniforms.selectedIdentifier ||
        loadIdentifier(pixel - vec2<i32>(distance, 0)) != uniforms.selectedIdentifier ||
        loadIdentifier(pixel + vec2<i32>(0, distance)) != uniforms.selectedIdentifier ||
        loadIdentifier(pixel - vec2<i32>(0, distance)) != uniforms.selectedIdentifier) {
      return vec4<f32>(uniforms.color.rgb * uniforms.color.a, uniforms.color.a);
    }
  }
  discard;
  return vec4<f32>(0.0);
}
`;
