// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowVectorByteLength,
  makeArrowFixedSizeListVector,
  StoragePathModel,
  StorageTripsPathModel
} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, ShaderInputs} from '@luma.gl/engine';
import {type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';
import {ArrowPathModelControlPanel, makeArrowPathModelControlPanelHtml} from './control-panel';
import {
  ArrowPathLayer,
  type ArrowPathLayerActiveModel,
  type ArrowPathLayerData,
  type ArrowPathLayerModel,
  type ArrowPathLayerTimeColumn,
  type ArrowPathColorType,
  type ArrowPathSourceCoordinateType,
  type ArrowPathSourceTimestampType
} from './arrow-path-layer';

export const title = 'Paths: XYZM + List<Timestamp>';
export const description =
  'Variable-length Arrow XYZM path rows rendered through attribute-backed and storage-backed path models, plus aligned List<Timestamp> rows for Trips-style temporal filtering.';

// PathLayer-style estimate: four vec3 position attributes plus width, color, picking, and type.
const DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT = 60;
const TEMPORAL_EPOCH_MILLISECONDS = 1_700_000_000_000n;
const TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT = 1000;
const MEASURE_SWEEP_DURATION = 1.48;
const TEMPORAL_TRAIL_LENGTH_MILLISECONDS = 220;
const STREAMING_PATH_BATCH_COUNT = 10;
const STREAMING_PATH_BATCH_INTERVAL_MS = 1000;
const STREAMING_PATH_ROWS_PER_CHUNK = 240;

type ArrowPathVertexColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
type ArrowPathBaseRowCountKind = '240' | '960' | '2400';
type ArrowPathRowCountKind = ArrowPathBaseRowCountKind | '2400-stream';
type ArrowPathCoordinateKind = 'float32' | 'float64';
type ArrowPathColorKind = 'none' | 'row-colors' | 'vertex-colors';
type ArrowPathTimeKind = ArrowPathLayerTimeColumn;
type ArrowPathInputKind =
  `${ArrowPathRowCountKind}-${ArrowPathCoordinateKind}-${ArrowPathColorKind}-${ArrowPathTimeKind}`;
type ArrowPathCapKind = 'square' | 'round';
type ArrowPathJointKind = 'miter' | 'round';
type ArrowPathDataset = {
  pathCount: number;
  pointCount: number;
  label: string;
};
type ArrowPathInput = ArrowPathLayerData & {
  widths: GPUVector<arrow.Float32>;
  pathArrowByteLength: number;
  styleArrowByteLength: number;
  arrowVectorBuildTimeMs: number;
};
type ArrowPathSourceVectors = {
  paths: arrow.Vector<ArrowPathSourceCoordinateType>;
  colors?: arrow.Vector<ArrowPathColorType>;
  widths: arrow.Vector<arrow.Float32>;
  timestamps?: arrow.Vector<ArrowPathSourceTimestampType>;
};
type ArrowPathSourceData = {
  sourceVectors: ArrowPathSourceVectors;
  pathArrowByteLength: number;
  styleArrowByteLength: number;
  arrowVectorBuildTimeMs: number;
};

const PATH_DATASETS: Record<ArrowPathBaseRowCountKind, ArrowPathDataset> = {
  '240': {
    pathCount: 240,
    pointCount: 18,
    label: '240 paths, 4.1K segments'
  },
  '960': {
    pathCount: 960,
    pointCount: 22,
    label: '960 paths, 20K segments'
  },
  '2400': {
    pathCount: 2400,
    pointCount: 26,
    label: '2.4K paths, 60K segments'
  }
};

const PATH_SHADER_LAYOUT = {
  attributes: [
    {name: 'segmentStartPositions', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentEndPositions', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentPreviousPositions', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentNextPositions', location: 3, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentFlags', location: 4, type: 'u32', stepMode: 'instance'},
    {name: 'rowIndices', location: 5, type: 'u32', stepMode: 'instance'},
    {name: 'segmentStartColors', location: 6, type: 'u32', stepMode: 'instance'},
    {name: 'segmentEndColors', location: 7, type: 'u32', stepMode: 'instance'},
    {name: 'widths', location: 8, type: 'f32', stepMode: 'instance'},
    {name: 'pathViewOrigins', location: 9, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const STORAGE_PATH_SHADER_LAYOUT = {
  attributes: [
    {name: 'segmentStartPointIndices', location: 0, type: 'u32', stepMode: 'instance'},
    {name: 'segmentFlags', location: 1, type: 'u32', stepMode: 'instance'},
    {name: 'rowIndices', location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const WGSL_SHADER = /* wgsl */ `\
struct PathViewportUniforms {
  viewportScale : vec2<f32>,
  time : f32,
  colorsEnabled : f32,
  widthsEnabled : f32,
  capRounded : f32,
  jointRounded : f32,
  miterLimit : f32,
};

@group(0) @binding(auto) var<uniform> pathViewport : PathViewportUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPositions : vec4<f32>,
  @location(1) segmentEndPositions : vec4<f32>,
  @location(2) segmentPreviousPositions : vec4<f32>,
  @location(3) segmentNextPositions : vec4<f32>,
  @location(4) segmentFlags : u32,
  @location(5) rowIndices : u32,
  @location(6) segmentStartColors : u32,
  @location(7) segmentEndColors : u32,
  @location(8) widths : f32,
  @location(9) pathViewOrigins : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) measure : f32,
  @location(2) cornerOffset : vec2<f32>,
  @location(3) miterLength : f32,
  @location(4) pathPosition : vec2<f32>,
  @location(5) pathLength : f32,
  @location(6) jointType : f32,
};

struct PathExtrusion {
  offset : vec2<f32>,
  cornerOffset : vec2<f32>,
  miterLength : f32,
  pathPosition : vec2<f32>,
  pathLength : f32,
  jointType : f32,
};

const PATH_EPSILON : f32 = 0.00001;
const PATH_SEGMENT_FIRST : u32 = 1u;
const PATH_SEGMENT_LAST : u32 = 2u;
const PATH_SEGMENT_CLOSED : u32 = 4u;

fn getSegmentVertex(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(0.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 5u) { return vec2<f32>(0.0, 1.0); }
  if (vertexIndex == 6u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 7u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 8u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 9u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 10u) { return vec2<f32>(1.0, 0.0); }
  return vec2<f32>(1.0, 1.0);
}

fn unpackPathColor(colorWord : u32) -> vec4<f32> {
  return unpack4x8unorm(colorWord);
}

fn flipIfTrue(flag : bool) -> f32 {
  return select(1.0, -1.0, flag);
}

fn computePathExtrusion(
  previousPoint : vec2<f32>,
  currentPoint : vec2<f32>,
  nextPoint : vec2<f32>,
  segmentVertex : vec2<f32>,
  halfWidth : f32,
  segmentFlags : u32
) -> PathExtrusion {
  let isEnd = segmentVertex.x > 0.5;
  let sideOfPath = segmentVertex.y;
  let isJoint = select(0.0, 1.0, abs(sideOfPath) < 0.5);
  let normalizedWidth = max(halfWidth, PATH_EPSILON);
  let deltaA = (currentPoint - previousPoint) / normalizedWidth;
  let deltaB = (nextPoint - currentPoint) / normalizedWidth;
  let lenA = length(deltaA);
  let lenB = length(deltaB);
  let dirA = deltaA / max(lenA, PATH_EPSILON);
  let dirB = deltaB / max(lenB, PATH_EPSILON);
  let perpA = vec2<f32>(-dirA.y, dirA.x);
  let perpB = vec2<f32>(-dirB.y, dirB.x);
  let tangentBasis = dirA + dirB;
  let tangentLength = length(tangentBasis);
  let tangent = select(
    perpA,
    tangentBasis / max(tangentLength, PATH_EPSILON),
    tangentLength > PATH_EPSILON
  );
  let miterVector = vec2<f32>(-tangent.y, tangent.x);
  let direction = select(dirB, dirA, isEnd);
  let perpendicular = select(perpB, perpA, isEnd);
  let pathLength = select(lenB, lenA, isEnd);
  let sinHalfAngle = abs(dot(miterVector, perpendicular));
  let cosHalfAngle = abs(dot(dirA, miterVector));
  let turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  let cornerPosition = sideOfPath * turnDirection;
  var miterSize = 1.0 / max(sinHalfAngle, PATH_EPSILON);
  let trimmedMiterSize = min(
    miterSize,
    max(lenA, lenB) / max(cosHalfAngle, PATH_EPSILON)
  );
  miterSize = select(trimmedMiterSize, miterSize, cornerPosition >= 0.0);
  var cornerOffset = mix(
    miterVector * miterSize,
    perpendicular,
    step(0.5, cornerPosition)
  ) * (sideOfPath + isJoint * turnDirection);
  let isFirst = (segmentFlags & PATH_SEGMENT_FIRST) != 0u;
  let isLast = (segmentFlags & PATH_SEGMENT_LAST) != 0u;
  let isClosed = (segmentFlags & PATH_SEGMENT_CLOSED) != 0u;
  let isStartCap = lenA <= PATH_EPSILON || (!isEnd && isFirst && !isClosed);
  let isEndCap = lenB <= PATH_EPSILON || (isEnd && isLast && !isClosed);
  let isCap = isStartCap || isEndCap;
  var jointType = pathViewport.jointRounded;
  if (isCap) {
    let capOffset =
      direction * pathViewport.capRounded * 4.0 * flipIfTrue(isStartCap);
    cornerOffset = mix(perpendicular * sideOfPath, capOffset, isJoint);
    jointType = pathViewport.capRounded;
  }
  let miterLength = select(
    dot(cornerOffset, miterVector * turnDirection),
    isJoint,
    isCap
  );
  let offsetFromStart = cornerOffset + deltaA * select(0.0, 1.0, isEnd);
  var extrusion : PathExtrusion;
  extrusion.offset = cornerOffset * halfWidth;
  extrusion.cornerOffset = cornerOffset;
  extrusion.miterLength = miterLength;
  extrusion.pathPosition = vec2<f32>(
    dot(offsetFromStart, perpendicular),
    dot(offsetFromStart, direction)
  );
  extrusion.pathLength = pathLength;
  extrusion.jointType = jointType;
  return extrusion;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let segmentVertex = getSegmentVertex(inputs.vertexIndex % 12u);
  let previousSegmentPosition = inputs.segmentPreviousPositions.xy;
  let startPosition = inputs.segmentStartPositions.xy;
  let endPosition = inputs.segmentEndPositions.xy;
  let nextSegmentPosition = inputs.segmentNextPositions.xy;
  let previousPoint = mix(previousSegmentPosition, startPosition, segmentVertex.x);
  let currentPoint = mix(startPosition, endPosition, segmentVertex.x);
  let nextPoint = mix(endPosition, nextSegmentPosition, segmentVertex.x);
  let halfWidth = mix(0.0035, inputs.widths, pathViewport.widthsEnabled);
  let extrusion = computePathExtrusion(
    previousPoint,
    currentPoint,
    nextPoint,
    segmentVertex,
    halfWidth,
    inputs.segmentFlags
  );
  let worldPosition = currentPoint + extrusion.offset + inputs.pathViewOrigins.xy;
  let neutralColor = vec4<f32>(0.78, 0.86, 0.96, 0.92);
  let pathColor = mix(
    unpackPathColor(inputs.segmentStartColors),
    unpackPathColor(inputs.segmentEndColors),
    segmentVertex.x
  );
  outputs.Position = vec4<f32>(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  outputs.color = mix(neutralColor, pathColor, pathViewport.colorsEnabled);
  outputs.measure = mix(
    inputs.segmentStartPositions.w + inputs.pathViewOrigins.w,
    inputs.segmentEndPositions.w + inputs.pathViewOrigins.w,
    segmentVertex.x
  );
  outputs.cornerOffset = extrusion.cornerOffset;
  outputs.miterLength = extrusion.miterLength;
  outputs.pathPosition = extrusion.pathPosition;
  outputs.pathLength = extrusion.pathLength;
  outputs.jointType = extrusion.jointType;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  if (inputs.pathPosition.y < 0.0 || inputs.pathPosition.y > inputs.pathLength) {
    if (inputs.jointType > 0.5 && length(inputs.cornerOffset) > 1.0) {
      discard;
    }
    if (inputs.jointType < 0.5 && inputs.miterLength > pathViewport.miterLimit + 1.0) {
      discard;
    }
  }
  let measureLag = pathViewport.time - inputs.measure;
  let measureReached = select(0.0, 1.0, measureLag >= 0.0);
  let measureHighlight = measureReached * (1.0 - smoothstep(0.0, 0.16, measureLag));
  let highlight = 0.24 + measureHighlight * 0.76;
  let lightenedColor = mix(
    inputs.color.rgb * 0.72,
    min(inputs.color.rgb * 1.18 + vec3<f32>(0.05), vec3<f32>(1.0)),
    highlight
  );
  return vec4<f32>(lightenedColor, inputs.color.a);
}
`;

function makeStoragePathWGSLShader({usesTimestampColumn}: {usesTimestampColumn: boolean}): string {
  return /* wgsl */ `\
struct PathViewportUniforms {
  viewportScale : vec2<f32>,
  time : f32,
  colorsEnabled : f32,
  widthsEnabled : f32,
  capRounded : f32,
  jointRounded : f32,
  miterLimit : f32,
};

@group(0) @binding(auto) var<uniform> pathViewport : PathViewportUniforms;
@group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
@group(0) @binding(auto) var<storage, read> pathRanges : array<vec4<u32>>;
@group(0) @binding(auto) var<storage, read> pathViewOrigins : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathVertexColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;
${usesTimestampColumn ? '@group(0) @binding(auto) var<storage, read> pathTimestamps : array<f32>;\n' : ''}

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

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;
${
  usesTimestampColumn
    ? `\

struct TripPathConfig {
  currentTime : f32,
  trailLength : f32,
  fadeTrail : u32,
  _padding0 : u32,
};

@group(0) @binding(auto) var<uniform> tripPathConfig : TripPathConfig;
`
    : ''
}

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentFlags : u32,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) measure : f32,
  @location(2) cornerOffset : vec2<f32>,
  @location(3) miterLength : f32,
  @location(4) pathPosition : vec2<f32>,
  @location(5) pathLength : f32,
  @location(6) jointType : f32,
${usesTimestampColumn ? '  @location(7) time : f32,\n' : ''}
};

struct PathExtrusion {
  offset : vec2<f32>,
  cornerOffset : vec2<f32>,
  miterLength : f32,
  pathPosition : vec2<f32>,
  pathLength : f32,
  jointType : f32,
};

const PATH_EPSILON : f32 = 0.00001;
const PATH_SEGMENT_FIRST : u32 = 1u;
const PATH_SEGMENT_LAST : u32 = 2u;
const PATH_SEGMENT_CLOSED : u32 = 4u;

fn getSegmentVertex(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(0.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 5u) { return vec2<f32>(0.0, 1.0); }
  if (vertexIndex == 6u) { return vec2<f32>(0.0, -1.0); }
  if (vertexIndex == 7u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 8u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 9u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 10u) { return vec2<f32>(1.0, 0.0); }
  return vec2<f32>(1.0, 1.0);
}

fn unpackPathColor(colorWord : u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn readPathComponent(pointIndex : u32, componentIndex : u32) -> f32 {
  if (componentIndex >= pathStorageStyleConfig.pathComponentCount) {
    return 0.0;
  }
  return pathValues[pointIndex * pathStorageStyleConfig.pathComponentCount + componentIndex];
}

fn readPathPoint(pointIndex : u32) -> vec4<f32> {
  return vec4<f32>(
    readPathComponent(pointIndex, 0u),
    readPathComponent(pointIndex, 1u),
    readPathComponent(pointIndex, 2u),
    readPathComponent(pointIndex, 3u)
  );
}

fn readPathRange(globalRowIndex : u32) -> vec4<u32> {
  return pathRanges[globalRowIndex - pathStorageStyleConfig.batchRowIndexBase];
}

fn readPathViewOrigin(rowIndex : u32) -> vec4<f32> {
  if (pathStorageStyleConfig.useViewOrigins == 0u) {
    return vec4<f32>(0.0);
  }
  return pathViewOrigins[rowIndex];
}

fn getSegmentEndPointIndex(segmentStartPointIndex : u32) -> u32 {
  return segmentStartPointIndex + 1u;
}

fn getSegmentPreviousPointIndex(
  pathRange : vec4<u32>,
  segmentStartPointIndex : u32,
  segmentFlags : u32
) -> u32 {
  let pathStart = pathRange.x;
  let pathEnd = pathRange.y;
  let isFirst = (segmentFlags & PATH_SEGMENT_FIRST) != 0u;
  let isClosed = (segmentFlags & PATH_SEGMENT_CLOSED) != 0u;
  if (isFirst && isClosed) {
    return pathEnd - 2u;
  }
  if (isFirst) {
    return segmentStartPointIndex;
  }
  return max(pathStart, segmentStartPointIndex - 1u);
}

fn getSegmentNextPointIndex(
  pathRange : vec4<u32>,
  segmentEndPointIndex : u32,
  segmentFlags : u32
) -> u32 {
  let pathStart = pathRange.x;
  let isLast = (segmentFlags & PATH_SEGMENT_LAST) != 0u;
  let isClosed = (segmentFlags & PATH_SEGMENT_CLOSED) != 0u;
  if (isLast && isClosed) {
    return pathStart + 1u;
  }
  if (isLast) {
    return segmentEndPointIndex;
  }
  return segmentEndPointIndex + 1u;
}

fn flipIfTrue(flag : bool) -> f32 {
  return select(1.0, -1.0, flag);
}

fn computePathExtrusion(
  previousPoint : vec2<f32>,
  currentPoint : vec2<f32>,
  nextPoint : vec2<f32>,
  segmentVertex : vec2<f32>,
  halfWidth : f32,
  segmentFlags : u32
) -> PathExtrusion {
  let isEnd = segmentVertex.x > 0.5;
  let sideOfPath = segmentVertex.y;
  let isJoint = select(0.0, 1.0, abs(sideOfPath) < 0.5);
  let normalizedWidth = max(halfWidth, PATH_EPSILON);
  let deltaA = (currentPoint - previousPoint) / normalizedWidth;
  let deltaB = (nextPoint - currentPoint) / normalizedWidth;
  let lenA = length(deltaA);
  let lenB = length(deltaB);
  let dirA = deltaA / max(lenA, PATH_EPSILON);
  let dirB = deltaB / max(lenB, PATH_EPSILON);
  let perpA = vec2<f32>(-dirA.y, dirA.x);
  let perpB = vec2<f32>(-dirB.y, dirB.x);
  let tangentBasis = dirA + dirB;
  let tangentLength = length(tangentBasis);
  let tangent = select(
    perpA,
    tangentBasis / max(tangentLength, PATH_EPSILON),
    tangentLength > PATH_EPSILON
  );
  let miterVector = vec2<f32>(-tangent.y, tangent.x);
  let direction = select(dirB, dirA, isEnd);
  let perpendicular = select(perpB, perpA, isEnd);
  let pathLength = select(lenB, lenA, isEnd);
  let sinHalfAngle = abs(dot(miterVector, perpendicular));
  let cosHalfAngle = abs(dot(dirA, miterVector));
  let turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  let cornerPosition = sideOfPath * turnDirection;
  var miterSize = 1.0 / max(sinHalfAngle, PATH_EPSILON);
  let trimmedMiterSize = min(
    miterSize,
    max(lenA, lenB) / max(cosHalfAngle, PATH_EPSILON)
  );
  miterSize = select(trimmedMiterSize, miterSize, cornerPosition >= 0.0);
  var cornerOffset = mix(
    miterVector * miterSize,
    perpendicular,
    step(0.5, cornerPosition)
  ) * (sideOfPath + isJoint * turnDirection);
  let isFirst = (segmentFlags & PATH_SEGMENT_FIRST) != 0u;
  let isLast = (segmentFlags & PATH_SEGMENT_LAST) != 0u;
  let isClosed = (segmentFlags & PATH_SEGMENT_CLOSED) != 0u;
  let isStartCap = lenA <= PATH_EPSILON || (!isEnd && isFirst && !isClosed);
  let isEndCap = lenB <= PATH_EPSILON || (isEnd && isLast && !isClosed);
  let isCap = isStartCap || isEndCap;
  var jointType = pathViewport.jointRounded;
  if (isCap) {
    let capOffset =
      direction * pathViewport.capRounded * 4.0 * flipIfTrue(isStartCap);
    cornerOffset = mix(perpendicular * sideOfPath, capOffset, isJoint);
    jointType = pathViewport.capRounded;
  }
  let miterLength = select(
    dot(cornerOffset, miterVector * turnDirection),
    isJoint,
    isCap
  );
  let offsetFromStart = cornerOffset + deltaA * select(0.0, 1.0, isEnd);
  var extrusion : PathExtrusion;
  extrusion.offset = cornerOffset * halfWidth;
  extrusion.cornerOffset = cornerOffset;
  extrusion.miterLength = miterLength;
  extrusion.pathPosition = vec2<f32>(
    dot(offsetFromStart, perpendicular),
    dot(offsetFromStart, direction)
  );
  extrusion.pathLength = pathLength;
  extrusion.jointType = jointType;
  return extrusion;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let segmentVertex = getSegmentVertex(inputs.vertexIndex % 12u);
  let pathRange = readPathRange(inputs.rowIndices);
  let segmentEndPointIndex = getSegmentEndPointIndex(inputs.segmentStartPointIndices);
  let segmentPreviousPointIndex = getSegmentPreviousPointIndex(
    pathRange,
    inputs.segmentStartPointIndices,
    inputs.segmentFlags
  );
  let segmentNextPointIndex = getSegmentNextPointIndex(
    pathRange,
    segmentEndPointIndex,
    inputs.segmentFlags
  );
  let previousPointValue = readPathPoint(segmentPreviousPointIndex);
  let startPointValue = readPathPoint(inputs.segmentStartPointIndices);
  let endPointValue = readPathPoint(segmentEndPointIndex);
  let nextPointValue = readPathPoint(segmentNextPointIndex);
  let previousPoint = mix(previousPointValue.xy, startPointValue.xy, segmentVertex.x);
  let currentPoint = mix(startPointValue.xy, endPointValue.xy, segmentVertex.x);
  let nextPoint = mix(endPointValue.xy, nextPointValue.xy, segmentVertex.x);
  let rowIndex = inputs.rowIndices - pathStorageStyleConfig.batchRowIndexBase;
  let rowOrigin = readPathViewOrigin(rowIndex);
  let storageWidth = select(
    pathStorageStyleConfig.constantWidth,
    pathRowWidths[rowIndex],
    pathStorageStyleConfig.useRowWidths != 0u
  );
  let halfWidth = mix(0.0035, storageWidth, pathViewport.widthsEnabled);
  let extrusion = computePathExtrusion(
    previousPoint,
    currentPoint,
    nextPoint,
    segmentVertex,
    halfWidth,
    inputs.segmentFlags
  );
  let worldPosition = currentPoint + extrusion.offset + rowOrigin.xy;
  let neutralColor = vec4<f32>(0.78, 0.86, 0.96, 0.92);
  var storageColor = pathStorageStyleConfig.constantColor;
  if (pathStorageStyleConfig.useVertexColors != 0u) {
    storageColor = mix(
      unpackPathColor(pathVertexColors[inputs.segmentStartPointIndices]),
      unpackPathColor(pathVertexColors[segmentEndPointIndex]),
      segmentVertex.x
    );
  } else if (pathStorageStyleConfig.useRowColors != 0u) {
    storageColor = unpackPathColor(pathRowColors[rowIndex]);
  }
  outputs.Position = vec4<f32>(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  outputs.color = mix(neutralColor, storageColor, pathViewport.colorsEnabled);
${
  usesTimestampColumn
    ? `\
  let timestamp = mix(
    pathTimestamps[inputs.segmentStartPointIndices],
    pathTimestamps[segmentEndPointIndex],
    segmentVertex.x
  );
  outputs.measure = timestamp / ${TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT}.0;
  outputs.time = timestamp;
`
    : '  outputs.measure = mix(startPointValue.w + rowOrigin.w, endPointValue.w + rowOrigin.w, segmentVertex.x);\n'
}
  outputs.cornerOffset = extrusion.cornerOffset;
  outputs.miterLength = extrusion.miterLength;
  outputs.pathPosition = extrusion.pathPosition;
  outputs.pathLength = extrusion.pathLength;
  outputs.jointType = extrusion.jointType;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
${
  usesTimestampColumn
    ? `\
  if (
    inputs.time > tripPathConfig.currentTime ||
    (tripPathConfig.fadeTrail != 0u &&
      inputs.time < tripPathConfig.currentTime - tripPathConfig.trailLength)
  ) {
    discard;
  }
`
    : ''
}
  if (inputs.pathPosition.y < 0.0 || inputs.pathPosition.y > inputs.pathLength) {
    if (inputs.jointType > 0.5 && length(inputs.cornerOffset) > 1.0) {
      discard;
    }
    if (inputs.jointType < 0.5 && inputs.miterLength > pathViewport.miterLimit + 1.0) {
      discard;
    }
  }
  let measureLag = pathViewport.time - inputs.measure;
  let measureReached = select(0.0, 1.0, measureLag >= 0.0);
  let measureHighlight = measureReached * (1.0 - smoothstep(0.0, 0.16, measureLag));
  let highlight = 0.24 + measureHighlight * 0.76;
  let lightenedColor = mix(
    inputs.color.rgb * 0.72,
    min(inputs.color.rgb * 1.18 + vec3<f32>(0.05), vec3<f32>(1.0)),
    highlight
  );
${
  usesTimestampColumn
    ? `\
  var alpha = inputs.color.a;
  if (tripPathConfig.fadeTrail != 0u) {
    alpha *= clamp(
      1.0 - (tripPathConfig.currentTime - inputs.time) / max(tripPathConfig.trailLength, 1.0),
      0.0,
      1.0
    );
  }
  return vec4<f32>(lightenedColor, alpha);
`
    : '  return vec4<f32>(lightenedColor, inputs.color.a);\n'
}
}
`;
}

const STORAGE_WGSL_SHADER = makeStoragePathWGSLShader({usesTimestampColumn: false});
const TRIPS_STORAGE_WGSL_SHADER = makeStoragePathWGSLShader({usesTimestampColumn: true});

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in vec4 segmentPreviousPositions;
in vec4 segmentNextPositions;
in uint segmentFlags;
in uint rowIndices;
in uint segmentStartColors;
in uint segmentEndColors;
in float widths;
in vec4 pathViewOrigins;

layout(std140) uniform pathViewportUniforms {
  vec2 viewportScale;
  float time;
  float colorsEnabled;
  float widthsEnabled;
  float capRounded;
  float jointRounded;
  float miterLimit;
} pathViewport;

out vec4 vColor;
out float vMeasure;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;

struct PathExtrusion {
  vec2 offset;
  vec2 cornerOffset;
  float miterLength;
  vec2 pathPosition;
  float pathLength;
  float jointType;
};

const float PATH_EPSILON = 0.00001;
const uint PATH_SEGMENT_FIRST = 1u;
const uint PATH_SEGMENT_LAST = 2u;
const uint PATH_SEGMENT_CLOSED = 4u;

vec2 getSegmentVertex(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(0.0, -1.0);
  if (vertexIndex == 2) return vec2(0.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, -1.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  if (vertexIndex == 5) return vec2(0.0, 1.0);
  if (vertexIndex == 6) return vec2(0.0, -1.0);
  if (vertexIndex == 7) return vec2(1.0, -1.0);
  if (vertexIndex == 8) return vec2(1.0, 1.0);
  if (vertexIndex == 9) return vec2(1.0, -1.0);
  if (vertexIndex == 10) return vec2(1.0, 0.0);
  return vec2(1.0, 1.0);
}

vec4 unpackPathColor(uint colorWord) {
  return vec4(
    float(colorWord & 255u),
    float((colorWord >> 8u) & 255u),
    float((colorWord >> 16u) & 255u),
    float((colorWord >> 24u) & 255u)
  ) / 255.0;
}

float flipIfTrue(bool flag) {
  return flag ? -1.0 : 1.0;
}

PathExtrusion computePathExtrusion(
  vec2 previousPoint,
  vec2 currentPoint,
  vec2 nextPoint,
  vec2 segmentVertex,
  float halfWidth,
  uint segmentMetadata
) {
  bool isEnd = segmentVertex.x > 0.5;
  float sideOfPath = segmentVertex.y;
  float isJoint = abs(sideOfPath) < 0.5 ? 1.0 : 0.0;
  float normalizedWidth = max(halfWidth, PATH_EPSILON);
  vec2 deltaA = (currentPoint - previousPoint) / normalizedWidth;
  vec2 deltaB = (nextPoint - currentPoint) / normalizedWidth;
  float lenA = length(deltaA);
  float lenB = length(deltaB);
  vec2 dirA = lenA > PATH_EPSILON ? normalize(deltaA) : vec2(0.0);
  vec2 dirB = lenB > PATH_EPSILON ? normalize(deltaB) : vec2(0.0);
  vec2 perpA = vec2(-dirA.y, dirA.x);
  vec2 perpB = vec2(-dirB.y, dirB.x);
  vec2 tangentBasis = dirA + dirB;
  vec2 tangent = length(tangentBasis) > PATH_EPSILON ? normalize(tangentBasis) : perpA;
  vec2 miterVector = vec2(-tangent.y, tangent.x);
  vec2 direction = isEnd ? dirA : dirB;
  vec2 perpendicular = isEnd ? perpA : perpB;
  float pathLength = isEnd ? lenA : lenB;
  float sinHalfAngle = abs(dot(miterVector, perpendicular));
  float cosHalfAngle = abs(dot(dirA, miterVector));
  float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  float cornerPosition = sideOfPath * turnDirection;
  float miterSize = 1.0 / max(sinHalfAngle, PATH_EPSILON);
  float trimmedMiterSize = min(miterSize, max(lenA, lenB) / max(cosHalfAngle, PATH_EPSILON));
  miterSize = cornerPosition >= 0.0 ? miterSize : trimmedMiterSize;
  vec2 cornerOffset = mix(
    miterVector * miterSize,
    perpendicular,
    step(0.5, cornerPosition)
  ) * (sideOfPath + isJoint * turnDirection);
  bool isFirst = (segmentMetadata & PATH_SEGMENT_FIRST) != 0u;
  bool isLast = (segmentMetadata & PATH_SEGMENT_LAST) != 0u;
  bool isClosed = (segmentMetadata & PATH_SEGMENT_CLOSED) != 0u;
  bool isStartCap = lenA <= PATH_EPSILON || (!isEnd && isFirst && !isClosed);
  bool isEndCap = lenB <= PATH_EPSILON || (isEnd && isLast && !isClosed);
  bool isCap = isStartCap || isEndCap;
  float jointType = pathViewport.jointRounded;
  if (isCap) {
    vec2 capOffset = direction * pathViewport.capRounded * 4.0 * flipIfTrue(isStartCap);
    cornerOffset = mix(perpendicular * sideOfPath, capOffset, isJoint);
    jointType = pathViewport.capRounded;
  }
  float miterLength = isCap
    ? isJoint
    : dot(cornerOffset, miterVector * turnDirection);
  vec2 offsetFromStart = cornerOffset + deltaA * (isEnd ? 1.0 : 0.0);
  PathExtrusion extrusion;
  extrusion.offset = cornerOffset * halfWidth;
  extrusion.cornerOffset = cornerOffset;
  extrusion.miterLength = miterLength;
  extrusion.pathPosition = vec2(
    dot(offsetFromStart, perpendicular),
    dot(offsetFromStart, direction)
  );
  extrusion.pathLength = pathLength;
  extrusion.jointType = jointType;
  return extrusion;
}

void main() {
  vec2 segmentVertex = getSegmentVertex(gl_VertexID % 12);
  vec2 previousSegmentPosition = segmentPreviousPositions.xy;
  vec2 startPosition = segmentStartPositions.xy;
  vec2 endPosition = segmentEndPositions.xy;
  vec2 nextSegmentPosition = segmentNextPositions.xy;
  vec2 previousPoint = mix(previousSegmentPosition, startPosition, segmentVertex.x);
  vec2 currentPoint = mix(startPosition, endPosition, segmentVertex.x);
  vec2 nextPoint = mix(endPosition, nextSegmentPosition, segmentVertex.x);
  float halfWidth = mix(0.0035, widths, pathViewport.widthsEnabled);
  PathExtrusion extrusion = computePathExtrusion(
    previousPoint,
    currentPoint,
    nextPoint,
    segmentVertex,
    halfWidth,
    segmentFlags
  );
  vec2 worldPosition = currentPoint + extrusion.offset + pathViewOrigins.xy;
  vec4 neutralColor = vec4(0.78, 0.86, 0.96, 0.92);
  vec4 pathColor = mix(
    unpackPathColor(segmentStartColors),
    unpackPathColor(segmentEndColors),
    segmentVertex.x
  );
  gl_Position = vec4(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  vColor = mix(neutralColor, pathColor, pathViewport.colorsEnabled);
  vMeasure = mix(
    segmentStartPositions.w + pathViewOrigins.w,
    segmentEndPositions.w + pathViewOrigins.w,
    segmentVertex.x
  );
  vCornerOffset = extrusion.cornerOffset;
  vMiterLength = extrusion.miterLength;
  vPathPosition = extrusion.pathPosition;
  vPathLength = extrusion.pathLength;
  vJointType = extrusion.jointType;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
in float vMeasure;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
out vec4 fragColor;

layout(std140) uniform pathViewportUniforms {
  vec2 viewportScale;
  float time;
  float colorsEnabled;
  float widthsEnabled;
  float capRounded;
  float jointRounded;
  float miterLimit;
} pathViewport;

void main() {
  if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
    if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
      discard;
    }
    if (vJointType < 0.5 && vMiterLength > pathViewport.miterLimit + 1.0) {
      discard;
    }
  }
  float measureLag = pathViewport.time - vMeasure;
  float measureReached = measureLag >= 0.0 ? 1.0 : 0.0;
  float measureHighlight = measureReached * (1.0 - smoothstep(0.0, 0.16, measureLag));
  float highlight = 0.24 + measureHighlight * 0.76;
  vec3 lightenedColor = mix(
    vColor.rgb * 0.72,
    min(vColor.rgb * 1.18 + vec3(0.05), vec3(1.0)),
    highlight
  );
  fragColor = vec4(lightenedColor, vColor.a);
}
`;

type PathViewportUniforms = {
  viewportScale: [number, number];
  time: number;
  colorsEnabled: number;
  widthsEnabled: number;
  capRounded: number;
  jointRounded: number;
  miterLimit: number;
};

const pathViewport: ShaderModule<PathViewportUniforms> = {
  name: 'pathViewport',
  uniformTypes: {
    viewportScale: 'vec2<f32>',
    time: 'f32',
    colorsEnabled: 'f32',
    widthsEnabled: 'f32',
    capRounded: 'f32',
    jointRounded: 'f32',
    miterLimit: 'f32'
  }
};

export default class ArrowPathModelAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowPathModelControlPanelHtml({
    rowLabels: {
      '240': PATH_DATASETS['240'].label,
      '960': PATH_DATASETS['960'].label,
      '2400': PATH_DATASETS['2400'].label,
      '2400-stream': `${PATH_DATASETS['2400'].label} streamed`
    },
    deckPathAttributeBytesPerSegment: DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT
  });

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{pathViewport: typeof pathViewport.props}>({
    pathViewport
  });
  readonly pathInputs: Partial<Record<ArrowPathInputKind, ArrowPathInput>> = {};
  activeRowCountKind: ArrowPathRowCountKind = '240';
  activeCoordinateKind: ArrowPathCoordinateKind = 'float32';
  activeColorKind: ArrowPathColorKind = 'vertex-colors';
  activeTimeKind: ArrowPathTimeKind = 'xyzm';
  activePathModelKind: ArrowPathLayerModel = 'auto';
  activePathInput!: ArrowPathInput;
  activeStreamingPathInput: ArrowPathInput | null = null;
  pathLayer!: ArrowPathLayer;
  streamingSessionVersion = 0;
  measureSweepEnabled = true;
  widthsEnabled = true;
  capKind: ArrowPathCapKind = 'square';
  jointKind: ArrowPathJointKind = 'miter';
  miterLimit = 4;
  measureTime = 0;
  lastRenderSeconds: number | null = null;
  controlPanel!: ArrowPathModelControlPanel;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    this.activePathInput = await this.getOrCreatePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
    this.pathLayer = this.createPathLayer(this.activePathInput, this.activePathModelKind);
    this.initializeControlPanel();
    this.updateMetricLabels();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (!this.pathLayer) {
      return;
    }

    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.measureSweepEnabled) {
      this.measureTime += elapsedSeconds * 0.24;
      if (this.measureTime > MEASURE_SWEEP_DURATION) {
        this.measureTime -= MEASURE_SWEEP_DURATION;
      }
    }
    if (this.pathLayer.resolvedModel === 'trips') {
      this.pathLayer.setProps({
        currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime)
      });
    }

    this.shaderInputs.setProps({
      pathViewport: {
        viewportScale: [1 / Math.max(aspect, 0.2), 1],
        time: this.measureTime,
        colorsEnabled: this.activeColorKind === 'none' ? 0 : 1,
        widthsEnabled: this.widthsEnabled ? 1 : 0,
        capRounded: this.capKind === 'round' ? 1 : 0,
        jointRounded: this.jointKind === 'round' ? 1 : 0,
        miterLimit: this.miterLimit
      }
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0.015, 0.035, 0.07, 1]
    });
    this.pathLayer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    ++this.streamingSessionVersion;
    this.controlPanel?.destroy();
    this.pathLayer?.destroy();
    for (const pathInput of Object.values(this.pathInputs)) {
      pathInput?.destroy();
    }
    this.activeStreamingPathInput?.destroy();
  }

  createPathLayer(pathInput: ArrowPathInput, modelKind: ArrowPathLayerModel): ArrowPathLayer {
    return new ArrowPathLayer(this.device, {
      id: 'arrow-path-model',
      data: pathInput,
      model: modelKind,
      timeColumn: this.activeTimeKind,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list' as const,
      vertexCount: 12,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      } as const,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: PATH_SHADER_LAYOUT,
      storageSource: STORAGE_WGSL_SHADER,
      storageShaderLayout: STORAGE_PATH_SHADER_LAYOUT,
      tripsSource: TRIPS_STORAGE_WGSL_SHADER,
      tripsShaderLayout: STORAGE_PATH_SHADER_LAYOUT,
      currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime),
      trailLength: TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
      color: [199, 219, 245, 235],
      width: 0.0035
    });
  }

  async getOrCreatePathInput(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind
  ): Promise<ArrowPathInput> {
    const inputKind = getArrowPathInputKind(rowCountKind, coordinateKind, colorKind, timeKind);
    const cachedPathInput = this.pathInputs[inputKind];
    if (cachedPathInput) {
      return cachedPathInput;
    }
    const pathInput = await makeArrowPathInput(
      this.device,
      PATH_DATASETS[getBaseArrowPathRowCountKind(rowCountKind)],
      coordinateKind,
      colorKind,
      timeKind,
      isStreamingArrowPathRowCountKind(rowCountKind) ? STREAMING_PATH_ROWS_PER_CHUNK : null
    );
    this.pathInputs[inputKind] = pathInput;
    return pathInput;
  }

  initializeControlPanel(): void {
    this.controlPanel = new ArrowPathModelControlPanel({
      device: this.device,
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountChange: this.handleRowCountSelection,
        onCoordinateChange: this.handleCoordinateSelection,
        onColorChange: this.handleColorColumnSelection,
        onTimeChange: this.handleTimeColumnSelection,
        onModelChange: this.handleModelSelection,
        onMeasureSweepChange: this.handleMeasureSweepToggle,
        onWidthChange: this.handleWidthToggle,
        onCapChange: this.handleCapSelection,
        onJointChange: this.handleJointSelection,
        onMiterLimitChange: this.handleMiterLimitInput
      }
    });
    this.controlPanel.initialize();
  }

  getControlPanelState() {
    return {
      rowCountKind: this.activeRowCountKind,
      coordinateKind: this.activeCoordinateKind,
      colorKind: this.activeColorKind,
      timeKind: this.activeTimeKind,
      modelKind: this.activePathModelKind,
      capKind: this.capKind,
      jointKind: this.jointKind,
      miterLimit: this.miterLimit
    };
  }

  updateMetricLabels(): void {
    const pathArrowBytes = this.activePathInput.pathArrowByteLength;
    const styleArrowBytes = this.activePathInput.styleArrowByteLength;
    const segmentCount = getGeneratedPathSegmentCount(this.pathLayer.model);
    const pathGpuBytes = getPathCoordinateGpuByteLength(this.activePathInput, this.pathLayer.model);
    const transientPathGpuBytes = getTransientPathGpuByteLength(this.pathLayer.model);
    const peakPathGpuBytes = pathGpuBytes + transientPathGpuBytes;
    const styleGpuBytes = getPathStyleGpuByteLength(this.activePathInput, this.pathLayer.model);
    const totalArrowBytes = pathArrowBytes + styleArrowBytes;
    const totalGpuBytes = pathGpuBytes + styleGpuBytes;
    const peakTotalGpuBytes = peakPathGpuBytes + styleGpuBytes;
    const deckGpuBytes = segmentCount * DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT;
    this.controlPanel.setMetricValues({
      pathCount: formatInteger(this.activePathInput.paths.length),
      segmentCount: formatInteger(segmentCount),
      pathArrowBytes: formatByteLength(pathArrowBytes),
      pathGpuBytes:
        transientPathGpuBytes > 0
          ? `${formatByteLength(pathGpuBytes)}\n${formatByteLength(peakPathGpuBytes)} peak`
          : formatByteLength(pathGpuBytes),
      pathGpuExpansion:
        transientPathGpuBytes > 0
          ? `${formatExpansionRatio(pathGpuBytes, pathArrowBytes)}\n${formatExpansionRatio(
              peakPathGpuBytes,
              pathArrowBytes
            )} peak`
          : formatExpansionRatio(pathGpuBytes, pathArrowBytes),
      pathPrepTime: `${getPathModelPrepTimeMs(this.pathLayer.model).toFixed(1)} ms`,
      styleArrowBytes: formatByteLength(styleArrowBytes),
      styleGpuBytes: formatByteLength(styleGpuBytes),
      styleGpuExpansion: formatExpansionRatio(styleGpuBytes, styleArrowBytes),
      styleBuildTime: `${this.activePathInput.arrowVectorBuildTimeMs.toFixed(1)} ms`,
      totalArrowBytes: formatByteLength(totalArrowBytes),
      totalGpuBytes:
        transientPathGpuBytes > 0
          ? `${formatByteLength(totalGpuBytes)}\n${formatByteLength(peakTotalGpuBytes)} peak`
          : formatByteLength(totalGpuBytes),
      totalGpuExpansion:
        transientPathGpuBytes > 0
          ? `${formatExpansionRatio(totalGpuBytes, totalArrowBytes)}\n${formatExpansionRatio(
              peakTotalGpuBytes,
              totalArrowBytes
            )} peak`
          : formatExpansionRatio(totalGpuBytes, totalArrowBytes),
      deckGpuBytes: formatByteLength(deckGpuBytes),
      deckGpuExpansion: formatExpansionRatio(deckGpuBytes, totalArrowBytes)
    });
  }

  readonly handleRowCountSelection = async (
    nextRowCountKind: ArrowPathRowCountKind
  ): Promise<void> => {
    if (nextRowCountKind === this.activeRowCountKind) {
      return;
    }
    await this.replacePathInput(
      nextRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleCoordinateSelection = async (
    nextCoordinateKind: ArrowPathCoordinateKind
  ): Promise<void> => {
    if (nextCoordinateKind === this.activeCoordinateKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      nextCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleColorColumnSelection = async (
    nextColorKind: ArrowPathColorKind
  ): Promise<void> => {
    if (nextColorKind === this.activeColorKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      nextColorKind,
      this.activeTimeKind
    );
  };

  readonly handleTimeColumnSelection = async (nextTimeKind: ArrowPathTimeKind): Promise<void> => {
    if (nextTimeKind === this.activeTimeKind) {
      return;
    }
    const nextPathModelKind = getValidPathModelKindForTimeKind(
      this.activePathModelKind,
      nextTimeKind
    );
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      nextTimeKind,
      nextPathModelKind
    );
  };

  readonly handleModelSelection = (requestedPathModelKind: ArrowPathLayerModel): void => {
    const nextPathModelKind = getValidPathModelKindForTimeKind(
      requestedPathModelKind,
      this.activeTimeKind
    );
    if (nextPathModelKind === this.activePathModelKind) {
      return;
    }
    this.replacePathModel(nextPathModelKind);
    this.updateMetricLabels();
  };

  replacePathModel(nextPathModelKind: ArrowPathLayerModel): void {
    const previousPathLayer = this.pathLayer;
    this.pathLayer = this.createPathLayer(this.activePathInput, nextPathModelKind);
    this.activePathModelKind = nextPathModelKind;
    this.controlPanel.syncControls(this.getControlPanelState());
    previousPathLayer.destroy();
  }

  async replacePathInput(
    nextRowCountKind: ArrowPathRowCountKind,
    nextCoordinateKind: ArrowPathCoordinateKind,
    nextColorKind: ArrowPathColorKind,
    nextTimeKind: ArrowPathTimeKind,
    nextPathModelKind = this.activePathModelKind
  ): Promise<void> {
    const streamingSessionVersion = ++this.streamingSessionVersion;
    if (isStreamingArrowPathRowCountKind(nextRowCountKind)) {
      this.activeRowCountKind = nextRowCountKind;
      this.activeCoordinateKind = nextCoordinateKind;
      this.activeColorKind = nextColorKind;
      this.activeTimeKind = nextTimeKind;
      this.activePathModelKind = getValidPathModelKindForTimeKind(nextPathModelKind, nextTimeKind);
      this.controlPanel.syncControls(this.getControlPanelState());
      void this.streamPathInputBatches(
        nextCoordinateKind,
        nextColorKind,
        nextTimeKind,
        streamingSessionVersion
      ).catch(() => {
        if (streamingSessionVersion === this.streamingSessionVersion) {
          ++this.streamingSessionVersion;
        }
      });
      return;
    }

    const nextPathInput = await this.getOrCreatePathInput(
      nextRowCountKind,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind
    );
    if (streamingSessionVersion !== this.streamingSessionVersion) {
      return;
    }
    const previousStreamingPathInput = this.activeStreamingPathInput;
    this.activeStreamingPathInput = null;
    this.activeRowCountKind = nextRowCountKind;
    this.activeCoordinateKind = nextCoordinateKind;
    this.activeColorKind = nextColorKind;
    this.activeTimeKind = nextTimeKind;
    this.activePathInput = nextPathInput;
    this.replacePathModel(nextPathModelKind);
    this.updateMetricLabels();
    previousStreamingPathInput?.destroy();
  }

  private async streamPathInputBatches(
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind,
    streamingSessionVersion: number
  ): Promise<void> {
    const sourceData = makeArrowPathSourceData(
      PATH_DATASETS['2400'],
      coordinateKind,
      colorKind,
      timeKind,
      STREAMING_PATH_ROWS_PER_CHUNK
    );
    const batchCount = Math.min(
      sourceData.sourceVectors.paths.data.length,
      STREAMING_PATH_BATCH_COUNT
    );

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      if (batchIndex > 0) {
        await sleep(STREAMING_PATH_BATCH_INTERVAL_MS);
      }
      if (streamingSessionVersion !== this.streamingSessionVersion) {
        return;
      }

      const pathInput = await makeArrowPathInputFromSourceData(
        this.device,
        sliceArrowPathSourceData(sourceData, batchIndex + 1)
      );
      if (streamingSessionVersion !== this.streamingSessionVersion) {
        pathInput.destroy();
        return;
      }

      const previousStreamingPathInput = this.activeStreamingPathInput;
      this.activeStreamingPathInput = pathInput;
      this.activePathInput = pathInput;
      this.replacePathModel(getValidPathModelKindForTimeKind(this.activePathModelKind, timeKind));
      this.updateMetricLabels();
      previousStreamingPathInput?.destroy();
    }
  }

  readonly handleMeasureSweepToggle = (enabled: boolean): void => {
    this.measureSweepEnabled = enabled;
  };

  readonly handleWidthToggle = (enabled: boolean): void => {
    this.widthsEnabled = enabled;
  };

  readonly handleCapSelection = (nextCapKind: ArrowPathCapKind): void => {
    this.capKind = nextCapKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleJointSelection = (nextJointKind: ArrowPathJointKind): void => {
    this.jointKind = nextJointKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleMiterLimitInput = (nextMiterLimit: number): void => {
    this.miterLimit = nextMiterLimit;
    this.controlPanel.syncControls(this.getControlPanelState());
  };
}

function getArrowPathInputKind(
  rowCountKind: ArrowPathRowCountKind,
  coordinateKind: ArrowPathCoordinateKind,
  colorKind: ArrowPathColorKind,
  timeKind: ArrowPathTimeKind
): ArrowPathInputKind {
  return `${rowCountKind}-${coordinateKind}-${colorKind}-${timeKind}`;
}

function isStreamingArrowPathRowCountKind(
  rowCountKind: ArrowPathRowCountKind
): rowCountKind is '2400-stream' {
  return rowCountKind === '2400-stream';
}

function getBaseArrowPathRowCountKind(
  rowCountKind: ArrowPathRowCountKind
): ArrowPathBaseRowCountKind {
  return isStreamingArrowPathRowCountKind(rowCountKind) ? '2400' : rowCountKind;
}

function getValidPathModelKindForTimeKind(
  modelKind: ArrowPathLayerModel,
  timeKind: ArrowPathTimeKind
): ArrowPathLayerModel {
  if (timeKind === 'timestamps') {
    return modelKind === 'auto' ? 'auto' : 'trips';
  }
  return modelKind === 'trips' ? 'auto' : modelKind;
}

function getPathCoordinateGpuByteLength(
  pathInput: ArrowPathInput,
  pathModel: ArrowPathLayerActiveModel
): number {
  const storagePathRangeGpuBytes = isStoragePathModel(pathModel)
    ? pathModel.pathRangeByteLength
    : 0;
  return (
    getGpuVectorByteLength(pathInput.paths) +
    (pathInput.timestamps ? getGpuVectorByteLength(pathInput.timestamps) : 0) +
    (pathInput.viewOrigins ? getGpuVectorByteLength(pathInput.viewOrigins) : 0) +
    storagePathRangeGpuBytes +
    getGeneratedPathGpuByteLength(pathModel)
  );
}

function getGeneratedPathGpuByteLength(pathModel: ArrowPathLayerActiveModel): number {
  if (isStoragePathModel(pathModel)) {
    return pathModel.generatedRenderBufferByteLength;
  }
  return pathModel.renderBatches.reduce(
    (byteLength, renderBatch) =>
      byteLength +
      renderBatch.expandedPathVertexData.byteLength +
      renderBatch.pathViewOriginData.byteLength,
    0
  );
}

function getTransientPathGpuByteLength(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel) ? pathModel.transientComputeInputByteLength : 0;
}

function getGeneratedPathSegmentCount(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel)
    ? pathModel.segmentCount
    : pathModel.segmentLayout.segmentCount;
}

function getPathStyleGpuByteLength(
  pathInput: ArrowPathInput,
  pathModel: ArrowPathLayerActiveModel
): number {
  const sourceStyleGpuBytes =
    (pathInput.colors ? getGpuVectorByteLength(pathInput.colors) : 0) +
    getGpuVectorByteLength(pathInput.widths);
  if (isStoragePathModel(pathModel)) {
    return sourceStyleGpuBytes + pathModel.rowStorageByteLength;
  }
  const expandedStyleGpuBytes = Object.values(pathModel.arrowGPUTable?.gpuVectors || {}).reduce(
    (byteLength, vector) => byteLength + getGpuVectorByteLength(vector),
    0
  );
  return sourceStyleGpuBytes + expandedStyleGpuBytes;
}

function getPathModelPrepTimeMs(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel)
    ? pathModel.pathRangeBuildTimeMs
    : pathModel.segmentAttributeBuildTimeMs;
}

function isStoragePathModel(
  pathModel: ArrowPathLayerActiveModel
): pathModel is StoragePathModel | StorageTripsPathModel {
  return pathModel instanceof StoragePathModel || pathModel instanceof StorageTripsPathModel;
}

async function makeArrowPathInput(
  device: Device,
  dataset: ArrowPathDataset,
  coordinateKind: ArrowPathCoordinateKind,
  colorKind: ArrowPathColorKind,
  timeKind: ArrowPathTimeKind,
  rowsPerChunk: number | null = null
): Promise<ArrowPathInput> {
  return makeArrowPathInputFromSourceData(
    device,
    makeArrowPathSourceData(dataset, coordinateKind, colorKind, timeKind, rowsPerChunk)
  );
}

function makeArrowPathSourceData(
  dataset: ArrowPathDataset,
  coordinateKind: ArrowPathCoordinateKind,
  colorKind: ArrowPathColorKind,
  timeKind: ArrowPathTimeKind,
  rowsPerChunk: number | null = null
): ArrowPathSourceData {
  const buildStartTime = getNow();
  const paths = makePathVector(dataset.pathCount, dataset.pointCount, coordinateKind, rowsPerChunk);
  const timestamps =
    timeKind === 'timestamps'
      ? makePathTimestampVector(dataset.pathCount, dataset.pointCount, rowsPerChunk)
      : undefined;
  const colors =
    colorKind === 'none'
      ? undefined
      : colorKind === 'vertex-colors'
        ? makePathColorListVector(dataset.pathCount, dataset.pointCount, rowsPerChunk)
        : makePathRowColorVector(dataset.pathCount, rowsPerChunk);
  const widths = makePathWidthVector(dataset.pathCount, rowsPerChunk);
  const arrowVectorBuildTimeMs = getNow() - buildStartTime;
  const pathArrowByteLength =
    getArrowVectorByteLength(paths) + (timestamps ? getArrowVectorByteLength(timestamps) : 0);
  const styleArrowByteLength =
    (colors ? getArrowVectorByteLength(colors) : 0) + getArrowVectorByteLength(widths);
  return {
    sourceVectors: {
      paths,
      ...(colors ? {colors} : {}),
      widths,
      ...(timestamps ? {timestamps} : {})
    },
    pathArrowByteLength,
    styleArrowByteLength,
    arrowVectorBuildTimeMs
  };
}

async function makeArrowPathInputFromSourceData(
  device: Device,
  sourceData: ArrowPathSourceData
): Promise<ArrowPathInput> {
  const {sourceVectors} = sourceData;
  const prepared = await ArrowPathLayer.prepareData(device, {
    id: 'arrow-path-model',
    sourceVectors
  });
  if (!prepared.widths) {
    throw new Error('Arrow path example expected prepared width GPU vectors');
  }
  if (sourceVectors.timestamps && !prepared.timestamps) {
    throw new Error('Arrow path example expected prepared timestamp GPU vectors');
  }

  return {
    paths: prepared.paths,
    ...(prepared.colors ? {colors: prepared.colors} : {}),
    widths: prepared.widths,
    ...(prepared.timestamps ? {timestamps: prepared.timestamps} : {}),
    ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
    pathState: prepared.pathState,
    pathArrowByteLength: sourceData.pathArrowByteLength,
    styleArrowByteLength: sourceData.styleArrowByteLength,
    arrowVectorBuildTimeMs: sourceData.arrowVectorBuildTimeMs,
    destroy: prepared.destroy
  };
}

function sliceArrowPathSourceData(
  sourceData: ArrowPathSourceData,
  chunkCount: number
): ArrowPathSourceData {
  const sourceVectors = {
    paths: sliceArrowVectorChunks(sourceData.sourceVectors.paths, chunkCount),
    ...(sourceData.sourceVectors.colors
      ? {colors: sliceArrowVectorChunks(sourceData.sourceVectors.colors, chunkCount)}
      : {}),
    widths: sliceArrowVectorChunks(sourceData.sourceVectors.widths, chunkCount),
    ...(sourceData.sourceVectors.timestamps
      ? {timestamps: sliceArrowVectorChunks(sourceData.sourceVectors.timestamps, chunkCount)}
      : {})
  };
  const pathArrowByteLength =
    getArrowVectorByteLength(sourceVectors.paths) +
    (sourceVectors.timestamps ? getArrowVectorByteLength(sourceVectors.timestamps) : 0);
  const styleArrowByteLength =
    (sourceVectors.colors ? getArrowVectorByteLength(sourceVectors.colors) : 0) +
    getArrowVectorByteLength(sourceVectors.widths);

  return {
    sourceVectors,
    pathArrowByteLength,
    styleArrowByteLength,
    arrowVectorBuildTimeMs: sourceData.arrowVectorBuildTimeMs
  };
}

function sliceArrowVectorChunks<T extends arrow.DataType>(
  vector: arrow.Vector<T>,
  chunkCount: number
): arrow.Vector<T> {
  return new arrow.Vector(vector.data.slice(0, chunkCount)) as arrow.Vector<T>;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function makePathVector(
  pathCount: number,
  pointCount: number,
  coordinateKind: ArrowPathCoordinateKind,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathSourceCoordinateType> {
  const coordinateValueType =
    coordinateKind === 'float64' ? new arrow.Float64() : new arrow.Float32();
  const coordinateType = new arrow.FixedSizeList(
    4,
    new arrow.Field('values', coordinateValueType, false)
  );
  const pathType = new arrow.List(new arrow.Field('coordinates', coordinateType, false));
  const dataChunks: arrow.Data<ArrowPathSourceCoordinateType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const valueOffsets = new Int32Array(chunkPathCount + 1);
    const values =
      coordinateKind === 'float64'
        ? new Float64Array(chunkPathCount * pointCount * 4)
        : new Float32Array(chunkPathCount * pointCount * 4);
    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      const pathIndex = pathStart + localPathIndex;
      valueOffsets[localPathIndex] = localPathIndex * pointCount;
      const normalizedPathIndex = pathCount <= 1 ? 0 : pathIndex / (pathCount - 1);
      const baseY = -0.92 + normalizedPathIndex * 1.84;
      const phase = pathIndex * 0.13;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
        const coordinateIndex = (localPathIndex * pointCount + pointIndex) * 4;
        values[coordinateIndex] = -1.24 + pathProgress * 2.48;
        values[coordinateIndex + 1] =
          baseY +
          Math.sin(pathProgress * 11.5 + phase) * 0.028 +
          Math.cos(pathProgress * 4.2 - phase * 0.55) * 0.014;
        values[coordinateIndex + 2] = 0;
        values[coordinateIndex + 3] = getPathMeasure(pathIndex, pointIndex, pointCount);
      }
    }
    valueOffsets[chunkPathCount] = chunkPathCount * pointCount;
    const coordinateValueData = new arrow.Data(coordinateValueType, 0, values.length, 0, {
      [arrow.BufferType.DATA]: values
    });
    const coordinateData = new arrow.Data(coordinateType, 0, values.length / 4, 0, {}, [
      coordinateValueData
    ]);
    dataChunks.push(
      new arrow.Data(pathType, 0, chunkPathCount, 0, {[arrow.BufferType.OFFSET]: valueOffsets}, [
        coordinateData
      ]) as arrow.Data<ArrowPathSourceCoordinateType>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathSourceCoordinateType>;
}

function makePathTimestampVector(
  pathCount: number,
  pointCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathSourceTimestampType> {
  const timestampType = new arrow.TimestampMillisecond();
  const pathTimestampType = new arrow.List(new arrow.Field('timestamps', timestampType, false));
  const dataChunks: arrow.Data<ArrowPathSourceTimestampType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const valueOffsets = new Int32Array(chunkPathCount + 1);
    const timestamps = new BigInt64Array(chunkPathCount * pointCount);
    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      const pathIndex = pathStart + localPathIndex;
      valueOffsets[localPathIndex] = localPathIndex * pointCount;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const timestampIndex = localPathIndex * pointCount + pointIndex;
        timestamps[timestampIndex] =
          TEMPORAL_EPOCH_MILLISECONDS +
          BigInt(
            Math.round(
              getPathMeasure(pathIndex, pointIndex, pointCount) *
                TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT
            )
          );
      }
    }
    valueOffsets[chunkPathCount] = chunkPathCount * pointCount;
    const timestampData = new arrow.Data(timestampType, 0, timestamps.length, 0, {
      [arrow.BufferType.DATA]: timestamps
    });
    dataChunks.push(
      new arrow.Data(
        pathTimestampType,
        0,
        chunkPathCount,
        0,
        {[arrow.BufferType.OFFSET]: valueOffsets},
        [timestampData]
      ) as arrow.Data<ArrowPathSourceTimestampType>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathSourceTimestampType>;
}

function makePathColorListVector(
  pathCount: number,
  pointCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathVertexColorType> {
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const pathColorType = new arrow.List(new arrow.Field('colors', colorType, false));
  const dataChunks: arrow.Data<ArrowPathVertexColorType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const valueOffsets = new Int32Array(chunkPathCount + 1);
    const colors = makePathVertexColors(pathStart, chunkPathCount, pointCount);
    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      valueOffsets[localPathIndex] = localPathIndex * pointCount;
    }
    valueOffsets[chunkPathCount] = chunkPathCount * pointCount;
    const colorValueData = new arrow.Data(new arrow.Uint8(), 0, colors.length, 0, {
      [arrow.BufferType.DATA]: colors
    });
    const colorData = new arrow.Data(colorType, 0, colors.length / 4, 0, {}, [colorValueData]);
    dataChunks.push(
      new arrow.Data(
        pathColorType,
        0,
        chunkPathCount,
        0,
        {[arrow.BufferType.OFFSET]: valueOffsets},
        [colorData]
      ) as arrow.Data<ArrowPathVertexColorType>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathVertexColorType>;
}

function makePathRowColorVector(
  pathCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> {
  const dataChunks: arrow.Data<arrow.FixedSizeList<arrow.Uint8>>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    dataChunks.push(
      makeArrowFixedSizeListVector(
        new arrow.Uint8(),
        4,
        makePathRowColors(pathStart, chunkPathCount)
      ).data[0] as arrow.Data<arrow.FixedSizeList<arrow.Uint8>>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>;
}

function makePathWidthVector(
  pathCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<arrow.Float32> {
  const dataChunks: arrow.Data<arrow.Float32>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const values = makePathWidths(pathStart, chunkPathCount);
    dataChunks.push(
      arrow.makeData({
        type: new arrow.Float32(),
        length: values.length,
        data: values
      }) as arrow.Data<arrow.Float32>
    );
  });
  return new arrow.Vector(dataChunks);
}

function forEachPathChunk(
  pathCount: number,
  rowsPerChunk: number | null,
  visitor: (pathStart: number, chunkPathCount: number) => void
): void {
  const safeRowsPerChunk =
    rowsPerChunk && rowsPerChunk > 0 && rowsPerChunk < pathCount ? rowsPerChunk : pathCount;
  for (let pathStart = 0; pathStart < pathCount; pathStart += safeRowsPerChunk) {
    visitor(pathStart, Math.min(safeRowsPerChunk, pathCount - pathStart));
  }
}

function getPathMeasure(pathIndex: number, pointIndex: number, pointCount: number): number {
  const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
  const pathClusterIndex = pathIndex % 5;
  const pathMeasureRate = 0.58 + pathClusterIndex * 0.16;
  const pathMeasurePhase = (Math.floor(pathIndex / 5) % 4) * 0.08;
  return pathProgress * pathMeasureRate + pathMeasurePhase;
}

function getTemporalCurrentTimeMilliseconds(measureTime: number): number {
  return Math.round(measureTime * TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT);
}

function makePathVertexColors(
  pathStart: number,
  pathCount: number,
  pointCount: number
): Uint8Array {
  const colors = new Uint8Array(pathCount * pointCount * 4);
  for (let localPathIndex = 0; localPathIndex < pathCount; localPathIndex++) {
    const pathIndex = pathStart + localPathIndex;
    const evenColor = getPathPaletteColor(pathIndex);
    const oddColor = getPathPaletteColor(pathIndex + 2);
    const accentColor = getPathPaletteColor(pathIndex + 4);
    const blueTarget: [number, number, number] = [42, 116, 255];
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
      const alternatingColor = pointIndex % 2 === 0 ? evenColor : oddColor;
      const pulseColor = pointIndex % 4 === 0 ? accentColor : alternatingColor;
      const blueFade = Math.min(1, Math.max(0, (pathProgress - 0.18) / 0.72));
      const bandBoost = pointIndex % 2 === 0 ? 72 : -28;
      const colorOffset = (localPathIndex * pointCount + pointIndex) * 4;
      colors[colorOffset] = clampColor(
        pulseColor[0] * (1 - blueFade) + blueTarget[0] * blueFade + bandBoost
      );
      colors[colorOffset + 1] = clampColor(
        pulseColor[1] * (1 - blueFade) + blueTarget[1] * blueFade + bandBoost
      );
      colors[colorOffset + 2] = clampColor(
        pulseColor[2] * (1 - blueFade) + blueTarget[2] * blueFade + bandBoost
      );
      colors[colorOffset + 3] = pointIndex % 2 === 0 ? 242 : 202;
    }
  }
  return colors;
}

function makePathRowColors(pathStart: number, pathCount: number): Uint8Array {
  const colors = new Uint8Array(pathCount * 4);
  for (let localPathIndex = 0; localPathIndex < pathCount; localPathIndex++) {
    const pathIndex = pathStart + localPathIndex;
    const paletteColor = getPathPaletteColor(pathIndex);
    const colorOffset = localPathIndex * 4;
    colors[colorOffset] = paletteColor[0];
    colors[colorOffset + 1] = paletteColor[1];
    colors[colorOffset + 2] = paletteColor[2];
    colors[colorOffset + 3] = 220;
  }
  return colors;
}

function makePathWidths(pathStart: number, pathCount: number): Float32Array {
  return Float32Array.from(
    {length: pathCount},
    (_, localPathIndex) => 0.0022 + ((pathStart + localPathIndex) % 7) * 0.00072
  );
}

function getPathPaletteColor(pathIndex: number): [number, number, number] {
  switch (pathIndex % 5) {
    case 0:
      return [72, 205, 217];
    case 1:
      return [255, 186, 73];
    case 2:
      return [255, 111, 97];
    case 3:
      return [120, 177, 255];
    default:
      return [152, 221, 132];
  }
}

function clampColor(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function getGpuVectorByteLength(vector: GPUVector<any>): number {
  return vector.data.reduce((byteLength, data) => {
    const variableLengthByteLength = data.readbackMetadata?.valueByteLength;
    return (
      byteLength +
      (variableLengthByteLength !== undefined
        ? variableLengthByteLength
        : data.length * data.byteStride)
    );
  }, 0);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatExpansionRatio(byteLength: number, arrowByteLength: number): string {
  const expansionFactor =
    Number.isFinite(arrowByteLength) && arrowByteLength > 0 ? byteLength / arrowByteLength : null;
  if (expansionFactor === null || !Number.isFinite(expansionFactor)) {
    return '-';
  }
  const precision = expansionFactor < 10 ? 1 : 0;
  return `${expansionFactor.toFixed(precision).replace(/\.0$/, '')}x`;
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetricDigits(byteLength / 1000)} kB`;
  }
  if (byteLength < 1000 ** 3) {
    return `${formatMetricDigits(byteLength / 1000 ** 2)} MB`;
  }
  return `${formatMetricDigits(byteLength / 1000 ** 3)} GB`;
}

function formatMetricDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 2}).format(value);
}

function getNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
