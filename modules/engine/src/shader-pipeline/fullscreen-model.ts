// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUVectorModel, type GPUVectorModelProps} from '../model/gpu-vector-model';

const VERTEX_WGSL = /* wgsl */ `
struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) position: vec2<f32>,
  @location(1) coordinate: vec2<f32>,
  @location(2) uv: vec2<f32>
};
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> FragmentInputs {
  let positions = array<vec2<f32>, 4>(
    vec2(-1., -1.), vec2(1., -1.), vec2(-1., 1.), vec2(1., 1.)
  );
  let position = positions[vertexIndex];
  var output: FragmentInputs;
  output.Position = vec4(position, 0., 1.);
  output.position = position;
  output.coordinate = (position + 1.) / 2.;
  output.uv = output.coordinate;
  return output;
}
`;
const VERTEX_GLSL = /* glsl */ `#version 300 es
out vec2 position;
out vec2 coordinate;
out vec2 uv;
void main() {
  vec2 positions[4] = vec2[4](vec2(-1., -1.), vec2(1., -1.), vec2(-1., 1.), vec2(1., 1.));
  position = positions[gl_VertexID];
  coordinate = (position + 1.) / 2.;
  uv = coordinate;
  gl_Position = vec4(position, 0., 1.);
}
`;

/** Fullscreen effect execution using the engine-owned model implementation. */
export function createFullscreenModel(device: Device, props: GPUVectorModelProps): GPUVectorModel {
  return new GPUVectorModel(device, {
    ...props,
    source: props.source ? `${VERTEX_WGSL}\n${props.source}` : undefined,
    vs: VERTEX_GLSL,
    topology: 'triangle-strip',
    vertexCount: 4
  });
}
