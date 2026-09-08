// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const source = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) fillPatternType: f32,
  @location(1) fillPatternSize: vec2<f32>,
  @location(2) fillPatternUv: vec2<f32>,
};

@vertex
fn vertexMain(
  @location(0) position: vec2<f32>,
  @location(1) fillPatternType: f32,
  @location(2) fillPatternSize: vec2<f32>,
  @location(3) fillPatternUv: vec2<f32>,
  @location(4) triangleCenter: vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  CLIP_POSITION(&output.position, triangleCenter, position);
  output.fillPatternType = fillPatternType;
  output.fillPatternSize = fillPatternSize;
  output.fillPatternUv = fillPatternUv;
  return output;
}

@fragment
fn fragmentMain(inputs: VertexOutput) -> @location(0) vec4<f32> {
  let fillColor = vec4<f32>(0.08, 0.09, 0.11, 1.0);
  var color = pluginApplyFillPattern(
    fillColor,
    inputs.fillPatternType,
    inputs.fillPatternUv,
    inputs.fillPatternSize
  );
  CLIP_COLOR(&color);
  return color;
}
`;

export const vs = /* glsl */ `\
#version 300 es

in vec2 position;
in float fillPatternType;
in vec2 fillPatternSize;
in vec2 fillPatternUv;
in vec2 triangleCenter;

out float vFillPatternType;
out vec2 vFillPatternSize;
out vec2 vFillPatternUv;

void main() {
  vFillPatternType = fillPatternType;
  vFillPatternSize = fillPatternSize;
  vFillPatternUv = fillPatternUv;
  gl_Position = vec4(position, 0.0, 1.0);
  CLIP_POSITION(gl_Position, triangleCenter, position);
}
`;

export const fs = /* glsl */ `\
#version 300 es
precision highp float;

in float vFillPatternType;
in vec2 vFillPatternSize;
in vec2 vFillPatternUv;

out vec4 fragColor;

void main() {
  vec4 fillColor = vec4(0.08, 0.09, 0.11, 1.0);
  fragColor = plugin_applyFillPattern(
    fillColor,
    vFillPatternType,
    vFillPatternUv,
    vFillPatternSize
  );
  CLIP_COLOR(fragColor);
}
`;
