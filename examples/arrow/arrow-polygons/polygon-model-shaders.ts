// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

export type PolygonViewportUniforms = {
  center: [number, number];
  scale: number;
  aspect: number;
};

export const polygonViewport: ShaderModule<PolygonViewportUniforms> = {
  name: 'polygonViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    scale: 'f32',
    aspect: 'f32'
  }
};

export const POLYGON_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec4<f32>'},
    {name: 'colors', location: 1, type: 'vec4<u32>'},
    {name: 'rowIndices', location: 2, type: 'u32'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const WGSL_SHADER = /* wgsl */ `\
struct PolygonViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> polygonViewport : PolygonViewportUniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>,
  @location(1) colors : vec4<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @interpolate(flat)
  @location(1) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let centered = (inputs.positions.xy - polygonViewport.center) * polygonViewport.scale;
  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(centered.x / max(polygonViewport.aspect, 0.2), centered.y, 0.0, 1.0);
  outputs.color = vec4<f32>(inputs.colors) / 255.0;
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return picking_filterHighlightColor(inputs.color, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

export const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec4 positions;
in uvec4 colors;
in uint rowIndices;

uniform polygonViewportUniforms {
  vec2 center;
  float scale;
  float aspect;
} polygonViewport;

out vec4 vColor;

void main(void) {
  vec2 centered = (positions.xy - polygonViewport.center) * polygonViewport.scale;
  gl_Position = vec4(centered.x / max(polygonViewport.aspect, 0.2), centered.y, 0.0, 1.0);
  vColor = vec4(colors) / 255.0;
  picking_setObjectIndex(int(rowIndices));
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = picking_filterColor(vColor);
}
`;

export const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

void main(void) {
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;
