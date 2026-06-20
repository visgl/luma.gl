// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ShaderLayout} from '@luma.gl/core';
import {type ShaderModule} from '@luma.gl/shadertools';

export const COLUMN_VERTEX_COUNT = 54;
export const CELL_GEOMETRY_POINT_COUNT = 7;
export const CELL_CENTROID_POINT_INDEX = 6;
export const COLUMN_GEOMETRY_WORKGROUP_SIZE = 64;

type ColumnRendererUniforms = {
  center: [number, number];
  currentTimestamp: number;
  cycleDuration: number;
  maxCount: number;
  heightScale: number;
  scale: number;
  tilt: number;
  aspect: number;
};

export const columnRenderer: ShaderModule<ColumnRendererUniforms> = {
  name: 'columnRenderer',
  uniformTypes: {
    center: 'vec2<f32>',
    currentTimestamp: 'f32',
    cycleDuration: 'f32',
    maxCount: 'f32',
    heightScale: 'f32',
    scale: 'f32',
    tilt: 'f32',
    aspect: 'f32'
  }
};

export const COLUMN_RENDERER_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'cellGeometryIndices', type: 'read-only-storage', group: 1, location: 0},
    {name: 'timeStarts', type: 'read-only-storage', group: 1, location: 1},
    {name: 'timeDurations', type: 'read-only-storage', group: 1, location: 2},
    {name: 'counts', type: 'read-only-storage', group: 1, location: 3},
    {name: 'cellGeometryPoints', type: 'read-only-storage', group: 1, location: 4}
  ]
} satisfies ShaderLayout;

export const RENDER_PARAMETERS = {
  depthWriteEnabled: true,
  depthCompare: 'less-equal',
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

export const COLUMN_RENDERER_WGSL_SHADER = /* wgsl */ `\
struct ColumnRendererUniforms {
  center : vec2<f32>,
  currentTimestamp : f32,
  cycleDuration : f32,
  maxCount : f32,
  heightScale : f32,
  scale : f32,
  tilt : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> columnRenderer : ColumnRendererUniforms;
@group(1) @binding(0) var<storage, read> cellGeometryIndices : array<u32>;
@group(1) @binding(1) var<storage, read> timeStarts : array<f32>;
@group(1) @binding(2) var<storage, read> timeDurations : array<f32>;
@group(1) @binding(3) var<storage, read> counts : array<f32>;
@group(1) @binding(4) var<storage, read> cellGeometryPoints : array<vec2<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

const PI : f32 = 3.141592653589793;
const DEGREES_TO_RADIANS : f32 = 0.017453292519943295;
const TOP_VERTEX_COUNT : u32 = 18u;
const CELL_GEOMETRY_POINT_COUNT : u32 = ${CELL_GEOMETRY_POINT_COUNT}u;
const CELL_CENTROID_POINT_INDEX : u32 = ${CELL_CENTROID_POINT_INDEX}u;
const VIEW_TILT_DEPTH_SCALE : f32 = 0.055;
const VIEW_TILT_HEIGHT_DEPTH_SCALE : f32 = 0.14;

fn latitudeToMercator(latitude : f32) -> f32 {
  let clampedLatitude = clamp(latitude, -85.0, 85.0) * DEGREES_TO_RADIANS;
  return log(tan(PI * 0.25 + clampedLatitude * 0.5));
}

fn projectLngLat(lngLat : vec2<f32>) -> vec2<f32> {
  let x = (lngLat.x - columnRenderer.center.x) / 180.0;
  let y = (latitudeToMercator(lngLat.y) - latitudeToMercator(columnRenderer.center.y)) / PI;
  return vec2<f32>(x / max(columnRenderer.aspect, 0.2), y) * columnRenderer.scale;
}

fn getTiltedDepth(projectedPosition : vec2<f32>, topOffset : f32) -> f32 {
  return clamp(
    0.5 + projectedPosition.y * VIEW_TILT_DEPTH_SCALE -
      topOffset * columnRenderer.tilt * VIEW_TILT_HEIGHT_DEPTH_SCALE,
    0.0,
    1.0
  );
}

fn getCellGeometryPoint(instanceIndex : u32, pointIndex : u32) -> vec2<f32> {
  let geometryIndex = cellGeometryIndices[instanceIndex];
  return cellGeometryPoints[geometryIndex * CELL_GEOMETRY_POINT_COUNT + pointIndex];
}

fn getTopLngLat(instanceIndex : u32, vertexIndex : u32) -> vec2<f32> {
  let localVertexIndex = vertexIndex % 3u;
  let triangleIndex = vertexIndex / 3u;
  if (localVertexIndex == 0u) {
    return getCellGeometryPoint(instanceIndex, CELL_CENTROID_POINT_INDEX);
  }
  if (localVertexIndex == 1u) {
    return getCellGeometryPoint(instanceIndex, triangleIndex);
  }
  return getCellGeometryPoint(instanceIndex, (triangleIndex + 1u) % 6u);
}

fn getSideCornerIndex(sideIndex : u32, localVertexIndex : u32) -> u32 {
  if (localVertexIndex == 0u || localVertexIndex == 3u || localVertexIndex == 5u) {
    return sideIndex;
  }
  return (sideIndex + 1u) % 6u;
}

fn getSideIsTop(localVertexIndex : u32) -> bool {
  return localVertexIndex == 2u || localVertexIndex == 4u || localVertexIndex == 5u;
}

fn getTimeActivation(eventStart : f32, eventDuration : f32) -> f32 {
  var elapsed = columnRenderer.currentTimestamp - eventStart;
  if (elapsed < 0.0) {
    elapsed += columnRenderer.cycleDuration;
  }
  if (elapsed < 0.0 || elapsed > eventDuration) {
    return 0.0;
  }

  let fadeIn = smoothstep(0.0, eventDuration * 0.28, elapsed);
  let fadeOut = 1.0 - smoothstep(eventDuration * 0.72, eventDuration, elapsed);
  return max(fadeIn * fadeOut, 0.05);
}

fn getColumnHeight(count : f32, activation : f32) -> f32 {
  let normalizedCount = sqrt(max(count, 0.0) / max(columnRenderer.maxCount, 1.0));
  return 0.006 + normalizedCount * activation * columnRenderer.heightScale;
}

fn getColumnColor(count : f32, activation : f32, isTop : bool) -> vec4<f32> {
  let normalizedCount = sqrt(max(count, 0.0) / max(columnRenderer.maxCount, 1.0));
  let coolColor = vec3<f32>(0.05, 0.56, 0.92);
  let warmColor = vec3<f32>(1.0, 0.72, 0.18);
  let hotColor = vec3<f32>(1.0, 0.18, 0.22);
  let colorRamp = mix(mix(coolColor, warmColor, smoothstep(0.0, 0.72, normalizedCount)), hotColor, smoothstep(0.58, 1.0, normalizedCount));
  let litColor = colorRamp * select(0.62, 1.0, isTop) * (0.54 + activation * 0.58);
  let alpha = select(0.0, 0.18 + activation * 0.48, activation > 0.0);
  return vec4<f32>(min(litColor, vec3<f32>(1.0)), alpha);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let eventStart = timeStarts[inputs.instanceIndex];
  let eventDuration = timeDurations[inputs.instanceIndex];
  let count = counts[inputs.instanceIndex];
  let activation = getTimeActivation(eventStart, eventDuration);
  let height = getColumnHeight(count, activation);

  var lngLat : vec2<f32>;
  var isTop = true;
  var topOffset = height;

  if (inputs.vertexIndex < TOP_VERTEX_COUNT) {
    lngLat = getTopLngLat(inputs.instanceIndex, inputs.vertexIndex);
  } else {
    let sideVertexIndex = inputs.vertexIndex - TOP_VERTEX_COUNT;
    let sideIndex = sideVertexIndex / 6u;
    let localVertexIndex = sideVertexIndex % 6u;
    lngLat = getCellGeometryPoint(
      inputs.instanceIndex,
      getSideCornerIndex(sideIndex, localVertexIndex)
    );
    isTop = getSideIsTop(localVertexIndex);
    if (!isTop) {
      topOffset = 0.0;
    }
  }

  let projectedPosition = projectLngLat(lngLat);
  let screenTopOffset = topOffset * columnRenderer.tilt;
  let depth = getTiltedDepth(projectedPosition, topOffset);
  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(projectedPosition + vec2<f32>(0.0, screenTopOffset), depth, 1.0);
  outputs.color = getColumnColor(count, activation, isTop);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  if (inputs.color.a <= 0.0) {
    discard;
  }
#if A_BUFFER_ENABLED
  return aBuffer_captureStraightColor(inputs.color, inputs.Position);
#else
  return inputs.color;
#endif
}
`;
