// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, ShaderLayout} from '@luma.gl/core';
import {getIndexPickingModule, indexPicking, ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';

/** Uniforms that project prepared polygon positions into clip space. */
export type PolygonViewportUniforms = {
  center: [number, number];
  scale: number;
  aspect: number;
};

/** Shader module used by filled polygon models. */
export const polygonViewport: ShaderModule<PolygonViewportUniforms> = {
  name: 'polygonViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    scale: 'f32',
    aspect: 'f32'
  }
};

/** Merges required polygon shader modules with caller additions, replacing defaults by name. */
export function mergePolygonShaderModules(
  defaultModules: unknown[],
  hostModules: {name: string}[]
): unknown[] {
  const hostModuleNames = new Set(hostModules.map(module => module.name));
  return [
    ...defaultModules.filter(module => {
      const moduleName = (module as {name?: string}).name;
      return !moduleName || !hostModuleNames.has(moduleName);
    }),
    ...hostModules
  ];
}

/** Shader inputs accepted by filled polygon models. */
export type PolygonShaderInputs = ShaderInputs<{
  polygonViewport: typeof polygonViewport.props;
  picking: typeof indexPicking.props;
}>;

/** Shader attribute layout consumed by attribute-backed filled polygon models. */
export const POLYGON_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec4<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'},
    {name: 'rowIndices', location: 2, type: 'u32'}
  ],
  bindings: []
} satisfies ShaderLayout;

/** Shader layout consumed by storage-backed filled polygon models. */
export const POLYGON_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'polygonPositions', type: 'read-only-storage', group: 0, location: 0},
    {name: 'polygonColors', type: 'read-only-storage', group: 0, location: 1},
    {name: 'polygonRowIndices', type: 'read-only-storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

/** WebGPU shader source for attribute-backed filled polygon models. */
export const POLYGON_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
struct PolygonViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> polygonViewport : PolygonViewportUniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>,
  @location(1) colors : vec4<f32>,
  @location(2) rowIndices : u32,
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

fn projectPolygonPosition(position : vec4<f32>) -> vec4<f32> {
  let centered = (position.xy - polygonViewport.center) * polygonViewport.scale;
  return vec4<f32>(centered.x / max(polygonViewport.aspect, 0.2), centered.y, 0.0, 1.0);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = projectPolygonPosition(inputs.positions);
  outputs.color = inputs.colors;
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

/** WebGPU shader source for storage-backed filled polygon models. */
export const POLYGON_STORAGE_WGSL_SHADER = /* wgsl */ `\
@group(0) @binding(auto) var<storage, read> polygonPositions : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> polygonColors : array<u32>;
@group(0) @binding(auto) var<storage, read> polygonRowIndices : array<u32>;

struct PolygonViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> polygonViewport : PolygonViewportUniforms;

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

fn unpackPolygonColor(colorWord : u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn projectPolygonPosition(position : vec4<f32>) -> vec4<f32> {
  let centered = (position.xy - polygonViewport.center) * polygonViewport.scale;
  return vec4<f32>(centered.x / max(polygonViewport.aspect, 0.2), centered.y, 0.0, 1.0);
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = projectPolygonPosition(polygonPositions[vertexIndex]);
  outputs.color = unpackPolygonColor(polygonColors[gpuTable_getRowIndex(
    vertexIndex,
    gpuTableColumns.polygonColorsRowMultiplier
  )]);
  outputs.objectIndex = i32(polygonRowIndices[vertexIndex]);
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

/** WebGL vertex shader source for attribute-backed filled polygon models. */
export const POLYGON_ATTRIBUTE_VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec4 positions;
in vec4 colors;
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
  vColor = colors;
  picking_setObjectIndex(int(rowIndices));
}
`;

/** WebGL fragment shader source for filled polygon models. */
export const POLYGON_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = picking_filterColor(vColor);
}
`;

/** WebGL integer picking fragment shader source for filled polygon models. */
export const POLYGON_PICKING_FS_GLSL = /* glsl */ `\
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

/** Creates shared shader inputs for filled polygon render and picking models. */
export function createPolygonShaderInputs(
  device: Device,
  pickingModule = getIndexPickingModule(device)
): PolygonShaderInputs {
  const shaderInputs: PolygonShaderInputs = new ShaderInputs<{
    polygonViewport: typeof polygonViewport.props;
    picking: typeof indexPicking.props;
  }>({
    polygonViewport,
    picking: pickingModule
  });
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

const DEFAULT_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;

const PICKING_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: false
} as const satisfies Record<string, unknown>;

/** Returns the default render parameters for normal or picking polygon draws. */
export function getPolygonPickingParameters(picking: boolean): Record<string, unknown> {
  return picking ? PICKING_RENDER_PARAMETERS : DEFAULT_RENDER_PARAMETERS;
}
