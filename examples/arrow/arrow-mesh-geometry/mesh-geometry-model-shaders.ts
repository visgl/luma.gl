// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Matrix4} from '@math.gl/core';

export const MESH_FACE_COUNT = 6;

export const WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
@group(0) @binding(auto) var<storage, read> faceColors : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> matrix : array<mat4x4<f32>>;
#endif

struct VertexInputs {
  @builtin(instance_index) instanceIndex : u32,
  @location(0) positions : vec3<f32>,
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
  @location(1) faceIndex : u32,
#else
  @location(1) colors : vec4<f32>,
  @location(2) faceIndices : u32,
  @location(3) matrixColumn0 : vec4<f32>,
  @location(4) matrixColumn1 : vec4<f32>,
  @location(5) matrixColumn2 : vec4<f32>,
  @location(6) matrixColumn3 : vec4<f32>,
#endif
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @interpolate(flat, either)
  @location(1) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
  let modelMatrix = matrix[inputs.instanceIndex];
#else
  let modelMatrix = mat4x4<f32>(
    inputs.matrixColumn0,
    inputs.matrixColumn1,
    inputs.matrixColumn2,
    inputs.matrixColumn3
  );
#endif
  var outputs : FragmentInputs;
  outputs.Position =
    app.projectionMatrix *
    app.viewMatrix *
    modelMatrix *
    vec4<f32>(inputs.positions, 1.0);
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
  outputs.color = faceColors[inputs.faceIndex];
  outputs.objectIndex = i32(inputs.instanceIndex * ${MESH_FACE_COUNT}u + inputs.faceIndex);
#else
  outputs.color = inputs.colors;
  outputs.objectIndex = i32(inputs.instanceIndex * ${MESH_FACE_COUNT}u + inputs.faceIndices);
#endif
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

uniform appUniforms {
  mat4 viewMatrix;
  mat4 projectionMatrix;
} app;

in vec3 positions;
in vec4 colors;
in uint faceIndices;
in vec4 matrixColumn0;
in vec4 matrixColumn1;
in vec4 matrixColumn2;
in vec4 matrixColumn3;

out vec4 vColor;

void main(void) {
  mat4 modelMatrix = mat4(
    matrixColumn0,
    matrixColumn1,
    matrixColumn2,
    matrixColumn3
  );
  gl_Position =
    app.projectionMatrix *
    app.viewMatrix *
    modelMatrix *
    vec4(positions, 1.0);
  vColor = colors;
  picking_setObjectIndex(gl_InstanceID * ${MESH_FACE_COUNT} + int(faceIndices));
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

export type AppUniforms = {
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
};

export const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

export const WEBGPU_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'faceIndex', location: 1, type: 'u32'}
  ],
  bindings: [{name: 'matrix', type: 'read-only-storage', group: 0, location: 2}]
} satisfies ShaderLayout;

export const WEBGL_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'},
    {name: 'faceIndices', location: 2, type: 'u32'},
    {name: 'matrixColumn0', location: 3, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn1', location: 4, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn2', location: 5, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn3', location: 6, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;
