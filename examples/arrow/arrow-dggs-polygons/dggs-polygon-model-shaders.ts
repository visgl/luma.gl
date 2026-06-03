// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

export type DggsViewportUniforms = {
  center: [number, number];
  scale: number;
  aspect: number;
};

export const dggsViewport: ShaderModule<DggsViewportUniforms> = {
  name: 'dggsViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    scale: 'f32',
    aspect: 'f32'
  }
};

export const DGGS_PATH_SOURCE = /* wgsl */ `\
@group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
@group(0) @binding(auto) var<storage, read> pathRanges : array<vec4<u32>>;
@group(0) @binding(auto) var<storage, read> pathViewOrigins : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathVertexColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  useViewOrigins : u32,
  useVertexColors : u32,
  _padding1 : u32,
};

struct DggsViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;
@group(0) @binding(auto) var<uniform> dggsViewport : DggsViewportUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentFlags : u32,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

const PI : f32 = 3.141592653589793;
const DEGREES_TO_RADIANS : f32 = 0.017453292519943295;

fn readPathComponent(pointIndex : u32, componentIndex : u32) -> f32 {
  if (componentIndex >= pathStorageStyleConfig.pathComponentCount) {
    return 0.0;
  }
  return pathValues[pointIndex * pathStorageStyleConfig.pathComponentCount + componentIndex];
}

fn readPathPoint(pointIndex : u32) -> vec2<f32> {
  return vec2<f32>(readPathComponent(pointIndex, 0u), readPathComponent(pointIndex, 1u));
}

fn latitudeToMercator(latitude : f32) -> f32 {
  let clampedLatitude = clamp(latitude, -85.0, 85.0) * DEGREES_TO_RADIANS;
  return log(tan(PI * 0.25 + clampedLatitude * 0.5));
}

fn projectLngLat(lngLat : vec2<f32>) -> vec2<f32> {
  let x = (lngLat.x - dggsViewport.center.x) / 180.0;
  let y = (latitudeToMercator(lngLat.y) - latitudeToMercator(dggsViewport.center.y)) / PI;
  return vec2<f32>(x / max(dggsViewport.aspect, 0.2), y) * dggsViewport.scale;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let pointIndex = inputs.segmentStartPointIndices + (inputs.vertexIndex & 1u);
  let lngLat = readPathPoint(pointIndex);
  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(projectLngLat(lngLat), 0.0, 1.0);
  outputs.color = pathStorageStyleConfig.constantColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;
