// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowPathModel,
  ArrowStoragePathModel,
  getArrowVectorByteLength,
  makeArrowFixedSizeListVector,
  type ArrowPathPreparedState
} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, ShaderInputs} from '@luma.gl/engine';
import {type ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';

export const title = 'Arrow Paths';
export const description =
  'Variable-length Arrow XYZM path rows rendered through attribute-backed and storage-backed path models with M-driven time highlighting.';

const MODEL_SELECTOR_ID = 'arrow-path-model-model';
const ROW_COUNT_SELECTOR_ID = 'arrow-path-model-row-count';
const COORDINATE_SELECTOR_ID = 'arrow-path-model-coordinates';
const MEASURE_SWEEP_TOGGLE_ID = 'arrow-path-model-measure-sweep';
const COLOR_TOGGLE_ID = 'arrow-path-model-colors';
const WIDTH_TOGGLE_ID = 'arrow-path-model-widths';
const CAP_SELECTOR_ID = 'arrow-path-model-cap-style';
const JOINT_SELECTOR_ID = 'arrow-path-model-joint-style';
const MITER_LIMIT_INPUT_ID = 'arrow-path-model-miter-limit';
const MITER_LIMIT_VALUE_ID = 'arrow-path-model-miter-limit-value';
const INFO_DETAILS_ID = 'arrow-path-model-details';
const PATH_COUNT_ID = 'arrow-path-model-path-count';
const SEGMENT_COUNT_ID = 'arrow-path-model-segment-count';
const PATH_ARROW_BYTES_ID = 'arrow-path-model-path-arrow-bytes';
const PATH_GPU_BYTES_ID = 'arrow-path-model-path-gpu-bytes';
const PATH_GPU_EXPANSION_ID = 'arrow-path-model-path-gpu-expansion';
const PATH_PREP_TIME_ID = 'arrow-path-model-path-prep-time';
const STYLE_ARROW_BYTES_ID = 'arrow-path-model-style-arrow-bytes';
const STYLE_GPU_BYTES_ID = 'arrow-path-model-style-gpu-bytes';
const STYLE_GPU_EXPANSION_ID = 'arrow-path-model-style-gpu-expansion';
const STYLE_BUILD_TIME_ID = 'arrow-path-model-style-build-time';
const TOTAL_ARROW_BYTES_ID = 'arrow-path-model-total-arrow-bytes';
const TOTAL_GPU_BYTES_ID = 'arrow-path-model-total-gpu-bytes';
const TOTAL_GPU_EXPANSION_ID = 'arrow-path-model-total-gpu-expansion';
const DECK_GPU_BYTES_ID = 'arrow-path-model-deck-gpu-bytes';
const DECK_GPU_EXPANSION_ID = 'arrow-path-model-deck-gpu-expansion';
// PathLayer-style estimate: four vec3 position attributes plus width, color, picking, and type.
const DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT = 60;

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type ArrowPathFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
type ArrowPathSourceCoordinateType = ArrowPathCoordinateType | ArrowPathFloat64CoordinateType;
type ArrowPathRowCountKind = '240' | '960' | '2400';
type ArrowPathCoordinateKind = 'float32' | 'float64';
type ArrowPathInputKind = `${ArrowPathRowCountKind}-${ArrowPathCoordinateKind}`;
type ArrowPathModelKind = 'attributes' | 'storage';
type ArrowPathCapKind = 'square' | 'round';
type ArrowPathJointKind = 'miter' | 'round';
type ActiveArrowPathModel = ArrowPathModel | ArrowStoragePathModel;
type ArrowPathDataset = {
  pathCount: number;
  pointCount: number;
  label: string;
};
type ArrowPathInput = {
  paths: GPUVector<ArrowPathCoordinateType>;
  colors: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  widths: GPUVector<arrow.Float32>;
  viewOrigins?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  pathState: ArrowPathPreparedState;
  pathArrowByteLength: number;
  styleArrowByteLength: number;
  arrowVectorBuildTimeMs: number;
  destroy: () => void;
};

const PATH_DATASETS: Record<ArrowPathRowCountKind, ArrowPathDataset> = {
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
    {name: 'colors', location: 6, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'widths', location: 7, type: 'f32', stepMode: 'instance'},
    {name: 'pathViewOrigins', location: 8, type: 'vec4<f32>', stepMode: 'instance'}
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
  @location(6) colors : vec4<f32>,
  @location(7) widths : f32,
  @location(8) pathViewOrigins : vec4<f32>,
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
  outputs.Position = vec4<f32>(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  outputs.color = mix(neutralColor, inputs.colors, pathViewport.colorsEnabled);
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

const STORAGE_WGSL_SHADER = /* wgsl */ `\
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
@group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  useViewOrigins : u32,
  _padding0 : u32,
  _padding1 : u32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;

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
  if (pathStorageStyleConfig.useRowColors != 0u) {
    storageColor = unpackPathColor(pathRowColors[rowIndex]);
  }
  outputs.Position = vec4<f32>(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  outputs.color = mix(neutralColor, storageColor, pathViewport.colorsEnabled);
  outputs.measure = mix(startPointValue.w + rowOrigin.w, endPointValue.w + rowOrigin.w, segmentVertex.x);
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
in vec4 colors;
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
  gl_Position = vec4(worldPosition * pathViewport.viewportScale, 0.0, 1.0);
  vColor = mix(neutralColor, colors, pathViewport.colorsEnabled);
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
  static info = `\
  <p>Renders nested Arrow coordinate lists through <code>ArrowPathModel</code> or <code>ArrowStoragePathModel</code>, one logical Arrow row per path.</p>
  <style>
    #${INFO_DETAILS_ID}[open] {
      min-height: 196px;
    }
  </style>
  <div style="min-height: 640px; max-height: calc(100vh - 72px); overflow-y: auto; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <div style="display: grid; grid-template-columns: minmax(48px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; margin-bottom: 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
      <label for="${MODEL_SELECTOR_ID}">Model</label>
      <select id="${MODEL_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="attributes">ArrowPathModel</option>
        <option value="storage">ArrowStoragePathModel</option>
      </select>
      <label for="${ROW_COUNT_SELECTOR_ID}">Data</label>
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(112px, auto); gap: 8px;">
        <select id="${ROW_COUNT_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="240">${PATH_DATASETS['240'].label}</option>
          <option value="960">${PATH_DATASETS['960'].label}</option>
          <option value="2400">${PATH_DATASETS['2400'].label}</option>
        </select>
        <select id="${COORDINATE_SELECTOR_ID}" aria-label="Coordinate type" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="float32">Float32</option>
          <option value="float64">Float64</option>
        </select>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 14px; color: #0f172a; font-size: 15px; font-weight: 600;">
      <label for="${MEASURE_SWEEP_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${MEASURE_SWEEP_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Sweep M</span>
      </label>
      <label for="${COLOR_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${COLOR_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Color</span>
      </label>
      <label for="${WIDTH_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${WIDTH_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Width</span>
      </label>
    </div>
    <div style="display: grid; grid-template-columns: minmax(56px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; margin-top: 14px; color: #0f172a; font-size: 14px; font-weight: 600;">
      <label for="${CAP_SELECTOR_ID}">Caps</label>
      <select id="${CAP_SELECTOR_ID}" style="min-width: 0; min-height: 32px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="square">Square</option>
        <option value="round">Round</option>
      </select>
      <label for="${JOINT_SELECTOR_ID}">Joins</label>
      <select id="${JOINT_SELECTOR_ID}" style="min-width: 0; min-height: 32px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="miter">Miter</option>
        <option value="round">Round</option>
      </select>
      <label for="${MITER_LIMIT_INPUT_ID}">Miter</label>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input id="${MITER_LIMIT_INPUT_ID}" type="range" min="1" max="8" step="0.25" value="4" style="width: 100%; accent-color: #2563eb;" />
        <output id="${MITER_LIMIT_VALUE_ID}" for="${MITER_LIMIT_INPUT_ID}" style="min-width: 36px; color: #334155; font-variant-numeric: tabular-nums;">4.00</output>
      </div>
    </div>
    ${makeMetricRow('Arrow path rows', PATH_COUNT_ID)}
    ${makeMetricRow('Generated segment rows', SEGMENT_COUNT_ID)}
    <table style="display: table; width: 100%; min-width: 100%; table-layout: fixed; box-sizing: border-box; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(208, 215, 222, 0.9); border-collapse: collapse; color: #334155; font-size: 13px; line-height: 1.4;">
      <thead>
        <tr style="color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; font-size: 11px;">
          <th style="width: 20%; padding: 8px 8px 6px 0; text-align: left; font-weight: 700; white-space: nowrap;">columns</th>
          <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">Arrow</th>
          <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">GPU</th>
          <th style="width: 16%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">expansion</th>
          <th style="width: 20%; padding: 8px 0 6px 8px; text-align: right; font-weight: 700; white-space: nowrap;">prep time</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">paths</th>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${PATH_PREP_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
        </tr>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">styles</th>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${STYLE_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
        </tr>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">total</th>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
        </tr>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">deck.gl</th>
          <td style="padding: 6px 8px; text-align: right;">-</td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
        </tr>
      </tbody>
    </table>
    <details id="${INFO_DETAILS_ID}" style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
      <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">What this example isolates</summary>
      <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
        <tbody>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Input</td><td style="padding: 7px 0;">Nested Float32 XYZM Arrow lists or CPU-prepared Float64 lists plus per-path color/width rows; M drives the time sweep</td></tr>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Shared drawing</td><td style="padding: 7px 0;">Both models render the same miter/round joins, square/round caps, and M-driven sweep; storage mode keeps generated segment records indexed</td></tr>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Attribute model</td><td style="padding: 7px 0;">CPU expansion builds segment records and repeats selected style rows into render attributes</td></tr>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">deck.gl estimate</td><td style="padding: 7px 0;">Approximate PathLayer attribute storage at ${DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT} bytes per generated segment</td></tr>
          <tr><td style="padding: 7px 0;">Storage model</td><td style="padding: 7px 0;">WebGPU compute expands nested rows while per-path colors and widths remain storage-backed</td></tr>
        </tbody>
      </table>
    </details>
  </div>
  `;

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{pathViewport: typeof pathViewport.props}>({
    pathViewport
  });
  readonly pathInputs: Partial<Record<ArrowPathInputKind, ArrowPathInput>> = {};
  activeRowCountKind: ArrowPathRowCountKind = '240';
  activeCoordinateKind: ArrowPathCoordinateKind = 'float32';
  activePathModelKind: ArrowPathModelKind = 'attributes';
  activePathInput!: ArrowPathInput;
  pathModel!: ActiveArrowPathModel;
  measureSweepEnabled = true;
  colorsEnabled = true;
  widthsEnabled = true;
  capKind: ArrowPathCapKind = 'square';
  jointKind: ArrowPathJointKind = 'miter';
  miterLimit = 4;
  measureTime = 0;
  lastRenderSeconds: number | null = null;
  modelSelector: HTMLSelectElement | null = null;
  rowCountSelector: HTMLSelectElement | null = null;
  coordinateSelector: HTMLSelectElement | null = null;
  measureSweepToggle: HTMLInputElement | null = null;
  colorToggle: HTMLInputElement | null = null;
  widthToggle: HTMLInputElement | null = null;
  capSelector: HTMLSelectElement | null = null;
  jointSelector: HTMLSelectElement | null = null;
  miterLimitInput: HTMLInputElement | null = null;
  miterLimitValue: HTMLOutputElement | null = null;
  pathCountLabel: HTMLElement | null = null;
  segmentCountLabel: HTMLElement | null = null;
  pathArrowBytesLabel: HTMLElement | null = null;
  pathGpuBytesLabel: HTMLElement | null = null;
  pathGpuExpansionLabel: HTMLElement | null = null;
  pathPrepTimeLabel: HTMLElement | null = null;
  styleArrowBytesLabel: HTMLElement | null = null;
  styleGpuBytesLabel: HTMLElement | null = null;
  styleGpuExpansionLabel: HTMLElement | null = null;
  styleBuildTimeLabel: HTMLElement | null = null;
  totalArrowBytesLabel: HTMLElement | null = null;
  totalGpuBytesLabel: HTMLElement | null = null;
  totalGpuExpansionLabel: HTMLElement | null = null;
  deckGpuBytesLabel: HTMLElement | null = null;
  deckGpuExpansionLabel: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    this.activePathInput = await this.getOrCreatePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind
    );
    this.pathModel = this.createPathModel(this.activePathInput, this.activePathModelKind);
    this.initializeControls();
    this.initializeMetricLabels();
    this.updateMetricLabels();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (!this.pathModel) {
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
      if (this.measureTime > 1.16) {
        this.measureTime -= 1.16;
      }
    }

    this.shaderInputs.setProps({
      pathViewport: {
        viewportScale: [1 / Math.max(aspect, 0.2), 1],
        time: this.measureTime,
        colorsEnabled: this.colorsEnabled ? 1 : 0,
        widthsEnabled: this.widthsEnabled ? 1 : 0,
        capRounded: this.capKind === 'round' ? 1 : 0,
        jointRounded: this.jointKind === 'round' ? 1 : 0,
        miterLimit: this.miterLimit
      }
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0.015, 0.035, 0.07, 1]
    });
    this.pathModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountSelection);
    this.coordinateSelector?.removeEventListener('change', this.handleCoordinateSelection);
    this.measureSweepToggle?.removeEventListener('change', this.handleMeasureSweepToggle);
    this.colorToggle?.removeEventListener('change', this.handleColorToggle);
    this.widthToggle?.removeEventListener('change', this.handleWidthToggle);
    this.capSelector?.removeEventListener('change', this.handleCapSelection);
    this.jointSelector?.removeEventListener('change', this.handleJointSelection);
    this.miterLimitInput?.removeEventListener('input', this.handleMiterLimitInput);
    this.pathModel?.destroy();
    for (const pathInput of Object.values(this.pathInputs)) {
      pathInput?.destroy();
    }
  }

  createPathModel(pathInput: ArrowPathInput, modelKind: ArrowPathModelKind): ActiveArrowPathModel {
    const commonProps = {
      id: 'arrow-path-model',
      paths: pathInput.paths,
      colors: pathInput.colors,
      widths: pathInput.widths,
      ...(pathInput.viewOrigins ? {viewOrigins: pathInput.viewOrigins} : {}),
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
      } as const
    };
    if (modelKind === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('ArrowStoragePathModel showcase mode requires WebGPU');
      }
      return new ArrowStoragePathModel(this.device, {
        ...commonProps,
        color: [199, 219, 245, 235],
        width: 0.0035,
        source: STORAGE_WGSL_SHADER,
        shaderLayout: STORAGE_PATH_SHADER_LAYOUT
      });
    }
    return new ArrowPathModel(this.device, {
      ...commonProps,
      pathState: pathInput.pathState,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: PATH_SHADER_LAYOUT
    });
  }

  async getOrCreatePathInput(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind
  ): Promise<ArrowPathInput> {
    const inputKind = getArrowPathInputKind(rowCountKind, coordinateKind);
    const cachedPathInput = this.pathInputs[inputKind];
    if (cachedPathInput) {
      return cachedPathInput;
    }
    const pathInput = await makeArrowPathInput(
      this.device,
      PATH_DATASETS[rowCountKind],
      coordinateKind
    );
    this.pathInputs[inputKind] = pathInput;
    return pathInput;
  }

  initializeControls(): void {
    this.modelSelector = document.getElementById(MODEL_SELECTOR_ID) as HTMLSelectElement | null;
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.coordinateSelector = document.getElementById(
      COORDINATE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.measureSweepToggle = document.getElementById(
      MEASURE_SWEEP_TOGGLE_ID
    ) as HTMLInputElement | null;
    this.colorToggle = document.getElementById(COLOR_TOGGLE_ID) as HTMLInputElement | null;
    this.widthToggle = document.getElementById(WIDTH_TOGGLE_ID) as HTMLInputElement | null;
    this.capSelector = document.getElementById(CAP_SELECTOR_ID) as HTMLSelectElement | null;
    this.jointSelector = document.getElementById(JOINT_SELECTOR_ID) as HTMLSelectElement | null;
    this.miterLimitInput = document.getElementById(MITER_LIMIT_INPUT_ID) as HTMLInputElement | null;
    this.miterLimitValue = document.getElementById(
      MITER_LIMIT_VALUE_ID
    ) as HTMLOutputElement | null;
    if (this.modelSelector) {
      this.modelSelector.value = this.activePathModelKind;
      this.modelSelector.disabled = this.device.type !== 'webgpu';
      this.modelSelector.addEventListener('change', this.handleModelSelection);
    }
    if (this.rowCountSelector) {
      this.rowCountSelector.value = this.activeRowCountKind;
      this.rowCountSelector.addEventListener('change', this.handleRowCountSelection);
    }
    if (this.coordinateSelector) {
      this.coordinateSelector.value = this.activeCoordinateKind;
      this.coordinateSelector.addEventListener('change', this.handleCoordinateSelection);
    }
    if (this.capSelector) {
      this.capSelector.value = this.capKind;
      this.capSelector.addEventListener('change', this.handleCapSelection);
    }
    if (this.jointSelector) {
      this.jointSelector.value = this.jointKind;
      this.jointSelector.addEventListener('change', this.handleJointSelection);
    }
    if (this.miterLimitInput) {
      this.miterLimitInput.value = this.miterLimit.toFixed(2);
      this.miterLimitInput.addEventListener('input', this.handleMiterLimitInput);
    }
    this.syncMiterLimitControls();
    this.measureSweepToggle?.addEventListener('change', this.handleMeasureSweepToggle);
    this.colorToggle?.addEventListener('change', this.handleColorToggle);
    this.widthToggle?.addEventListener('change', this.handleWidthToggle);
  }

  initializeMetricLabels(): void {
    this.pathCountLabel = document.getElementById(PATH_COUNT_ID);
    this.segmentCountLabel = document.getElementById(SEGMENT_COUNT_ID);
    this.pathArrowBytesLabel = document.getElementById(PATH_ARROW_BYTES_ID);
    this.pathGpuBytesLabel = document.getElementById(PATH_GPU_BYTES_ID);
    this.pathGpuExpansionLabel = document.getElementById(PATH_GPU_EXPANSION_ID);
    this.pathPrepTimeLabel = document.getElementById(PATH_PREP_TIME_ID);
    this.styleArrowBytesLabel = document.getElementById(STYLE_ARROW_BYTES_ID);
    this.styleGpuBytesLabel = document.getElementById(STYLE_GPU_BYTES_ID);
    this.styleGpuExpansionLabel = document.getElementById(STYLE_GPU_EXPANSION_ID);
    this.styleBuildTimeLabel = document.getElementById(STYLE_BUILD_TIME_ID);
    this.totalArrowBytesLabel = document.getElementById(TOTAL_ARROW_BYTES_ID);
    this.totalGpuBytesLabel = document.getElementById(TOTAL_GPU_BYTES_ID);
    this.totalGpuExpansionLabel = document.getElementById(TOTAL_GPU_EXPANSION_ID);
    this.deckGpuBytesLabel = document.getElementById(DECK_GPU_BYTES_ID);
    this.deckGpuExpansionLabel = document.getElementById(DECK_GPU_EXPANSION_ID);
  }

  updateMetricLabels(): void {
    const pathArrowBytes = this.activePathInput.pathArrowByteLength;
    const styleArrowBytes = this.activePathInput.styleArrowByteLength;
    const segmentCount = getGeneratedPathSegmentCount(this.pathModel);
    const pathGpuBytes = getPathCoordinateGpuByteLength(this.activePathInput, this.pathModel);
    const transientPathGpuBytes = getTransientPathGpuByteLength(this.pathModel);
    const peakPathGpuBytes = pathGpuBytes + transientPathGpuBytes;
    const styleGpuBytes = getPathStyleGpuByteLength(this.activePathInput, this.pathModel);
    const totalArrowBytes = pathArrowBytes + styleArrowBytes;
    const totalGpuBytes = pathGpuBytes + styleGpuBytes;
    const peakTotalGpuBytes = peakPathGpuBytes + styleGpuBytes;
    const deckGpuBytes = segmentCount * DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT;
    setMetricText(this.pathCountLabel, formatInteger(this.activePathInput.paths.length));
    setMetricText(this.segmentCountLabel, formatInteger(segmentCount));
    setMetricText(this.pathArrowBytesLabel, formatByteLength(pathArrowBytes));
    setMetricText(
      this.pathGpuBytesLabel,
      transientPathGpuBytes > 0
        ? `${formatByteLength(pathGpuBytes)}\n${formatByteLength(peakPathGpuBytes)} peak`
        : formatByteLength(pathGpuBytes)
    );
    setMetricText(
      this.pathGpuExpansionLabel,
      transientPathGpuBytes > 0
        ? `${formatExpansionRatio(pathGpuBytes, pathArrowBytes)}\n${formatExpansionRatio(
            peakPathGpuBytes,
            pathArrowBytes
          )} peak`
        : formatExpansionRatio(pathGpuBytes, pathArrowBytes)
    );
    setMetricText(
      this.pathPrepTimeLabel,
      `${getPathModelPrepTimeMs(this.pathModel).toFixed(1)} ms`
    );
    setMetricText(this.styleArrowBytesLabel, formatByteLength(styleArrowBytes));
    setMetricText(this.styleGpuBytesLabel, formatByteLength(styleGpuBytes));
    setMetricText(
      this.styleGpuExpansionLabel,
      formatExpansionRatio(styleGpuBytes, styleArrowBytes)
    );
    setMetricText(
      this.styleBuildTimeLabel,
      `${this.activePathInput.arrowVectorBuildTimeMs.toFixed(1)} ms`
    );
    setMetricText(this.totalArrowBytesLabel, formatByteLength(totalArrowBytes));
    setMetricText(
      this.totalGpuBytesLabel,
      transientPathGpuBytes > 0
        ? `${formatByteLength(totalGpuBytes)}\n${formatByteLength(peakTotalGpuBytes)} peak`
        : formatByteLength(totalGpuBytes)
    );
    setMetricText(
      this.totalGpuExpansionLabel,
      transientPathGpuBytes > 0
        ? `${formatExpansionRatio(totalGpuBytes, totalArrowBytes)}\n${formatExpansionRatio(
            peakTotalGpuBytes,
            totalArrowBytes
          )} peak`
        : formatExpansionRatio(totalGpuBytes, totalArrowBytes)
    );
    setMetricText(this.deckGpuBytesLabel, formatByteLength(deckGpuBytes));
    setMetricText(this.deckGpuExpansionLabel, formatExpansionRatio(deckGpuBytes, totalArrowBytes));
  }

  readonly handleRowCountSelection = async (): Promise<void> => {
    const nextRowCountKind = this.rowCountSelector?.value as ArrowPathRowCountKind | undefined;
    if (!nextRowCountKind || nextRowCountKind === this.activeRowCountKind) {
      return;
    }
    await this.replacePathInput(nextRowCountKind, this.activeCoordinateKind);
  };

  readonly handleCoordinateSelection = async (): Promise<void> => {
    const nextCoordinateKind = this.coordinateSelector?.value as
      | ArrowPathCoordinateKind
      | undefined;
    if (!nextCoordinateKind || nextCoordinateKind === this.activeCoordinateKind) {
      return;
    }
    await this.replacePathInput(this.activeRowCountKind, nextCoordinateKind);
  };

  readonly handleModelSelection = (): void => {
    const requestedPathModelKind = this.modelSelector?.value as ArrowPathModelKind | undefined;
    const nextPathModelKind =
      requestedPathModelKind === 'storage' && this.device.type === 'webgpu'
        ? 'storage'
        : 'attributes';
    if (nextPathModelKind === this.activePathModelKind) {
      return;
    }
    this.replacePathModel(nextPathModelKind);
    this.updateMetricLabels();
  };

  replacePathModel(nextPathModelKind: ArrowPathModelKind): void {
    const previousPathModel = this.pathModel;
    this.pathModel = this.createPathModel(this.activePathInput, nextPathModelKind);
    this.activePathModelKind = nextPathModelKind;
    if (this.modelSelector) {
      this.modelSelector.value = nextPathModelKind;
    }
    previousPathModel.destroy();
  }

  async replacePathInput(
    nextRowCountKind: ArrowPathRowCountKind,
    nextCoordinateKind: ArrowPathCoordinateKind
  ): Promise<void> {
    const nextPathInput = await this.getOrCreatePathInput(nextRowCountKind, nextCoordinateKind);
    this.activeRowCountKind = nextRowCountKind;
    this.activeCoordinateKind = nextCoordinateKind;
    this.activePathInput = nextPathInput;
    this.replacePathModel(this.activePathModelKind);
    this.updateMetricLabels();
  }

  readonly handleMeasureSweepToggle = (): void => {
    this.measureSweepEnabled = Boolean(this.measureSweepToggle?.checked);
  };

  readonly handleColorToggle = (): void => {
    this.colorsEnabled = Boolean(this.colorToggle?.checked);
  };

  readonly handleWidthToggle = (): void => {
    this.widthsEnabled = Boolean(this.widthToggle?.checked);
  };

  readonly handleCapSelection = (): void => {
    this.capKind = this.capSelector?.value === 'round' ? 'round' : 'square';
  };

  readonly handleJointSelection = (): void => {
    this.jointKind = this.jointSelector?.value === 'round' ? 'round' : 'miter';
    this.syncMiterLimitControls();
  };

  readonly handleMiterLimitInput = (): void => {
    const nextMiterLimit = Number(this.miterLimitInput?.value ?? this.miterLimit);
    this.miterLimit = Number.isFinite(nextMiterLimit) ? nextMiterLimit : this.miterLimit;
    this.syncMiterLimitControls();
  };

  syncMiterLimitControls(): void {
    if (this.miterLimitInput) {
      this.miterLimitInput.disabled = this.jointKind !== 'miter';
    }
    if (this.miterLimitValue) {
      this.miterLimitValue.textContent = this.miterLimit.toFixed(2);
    }
  }
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(226, 232, 240, 0.9); color: #334155; font-size: 13px; line-height: 1.4;"><span>${label}</span><strong id="${id}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></div>`;
}

function getArrowPathInputKind(
  rowCountKind: ArrowPathRowCountKind,
  coordinateKind: ArrowPathCoordinateKind
): ArrowPathInputKind {
  return `${rowCountKind}-${coordinateKind}`;
}

function getPathCoordinateGpuByteLength(
  pathInput: ArrowPathInput,
  pathModel: ActiveArrowPathModel
): number {
  const storagePathRangeGpuBytes =
    pathModel instanceof ArrowStoragePathModel ? pathModel.pathRangeByteLength : 0;
  return (
    getGpuVectorByteLength(pathInput.paths) +
    (pathInput.viewOrigins ? getGpuVectorByteLength(pathInput.viewOrigins) : 0) +
    storagePathRangeGpuBytes +
    getGeneratedPathGpuByteLength(pathModel)
  );
}

function getGeneratedPathGpuByteLength(pathModel: ActiveArrowPathModel): number {
  if (pathModel instanceof ArrowStoragePathModel) {
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

function getTransientPathGpuByteLength(pathModel: ActiveArrowPathModel): number {
  return pathModel instanceof ArrowStoragePathModel ? pathModel.transientComputeInputByteLength : 0;
}

function getGeneratedPathSegmentCount(pathModel: ActiveArrowPathModel): number {
  return pathModel instanceof ArrowStoragePathModel
    ? pathModel.segmentCount
    : pathModel.segmentLayout.segmentCount;
}

function getPathStyleGpuByteLength(
  pathInput: ArrowPathInput,
  pathModel: ActiveArrowPathModel
): number {
  const sourceStyleGpuBytes =
    getGpuVectorByteLength(pathInput.colors) + getGpuVectorByteLength(pathInput.widths);
  if (pathModel instanceof ArrowStoragePathModel) {
    return sourceStyleGpuBytes + pathModel.rowStorageByteLength;
  }
  const expandedStyleGpuBytes = Object.values(pathModel.arrowGPUTable?.gpuVectors || {}).reduce(
    (byteLength, vector) => byteLength + getGpuVectorByteLength(vector),
    0
  );
  return sourceStyleGpuBytes + expandedStyleGpuBytes;
}

function getPathModelPrepTimeMs(pathModel: ActiveArrowPathModel): number {
  return pathModel instanceof ArrowStoragePathModel
    ? pathModel.pathRangeBuildTimeMs
    : pathModel.segmentAttributeBuildTimeMs;
}

async function makeArrowPathInput(
  device: Device,
  dataset: ArrowPathDataset,
  coordinateKind: ArrowPathCoordinateKind
): Promise<ArrowPathInput> {
  const buildStartTime = getNow();
  const paths = makePathVector(dataset.pathCount, dataset.pointCount, coordinateKind);
  const colors = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    makePathColors(dataset.pathCount)
  );
  const widths = arrow.vectorFromArray(makePathWidths(dataset.pathCount), new arrow.Float32());
  const arrowVectorBuildTimeMs = getNow() - buildStartTime;
  const pathArrowByteLength = getArrowVectorByteLength(paths);
  const styleArrowByteLength = getArrowVectorByteLength(colors) + getArrowVectorByteLength(widths);
  const prepared = await ArrowPathModel.prepareGPUVectors(
    device,
    {
      paths,
      colors,
      widths
    },
    {
      id: 'arrow-path-model'
    }
  );
  if (!prepared.colors || !prepared.widths) {
    throw new Error('Arrow path example expected prepared color and width GPU vectors');
  }

  return {
    paths: prepared.paths,
    colors: prepared.colors,
    widths: prepared.widths,
    ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
    pathState: prepared.pathProps.pathState,
    pathArrowByteLength,
    styleArrowByteLength,
    arrowVectorBuildTimeMs,
    destroy: prepared.destroy
  };
}

function makePathVector(
  pathCount: number,
  pointCount: number,
  coordinateKind: ArrowPathCoordinateKind
): arrow.Vector<ArrowPathSourceCoordinateType> {
  const valueOffsets = new Int32Array(pathCount + 1);
  const coordinateValueType =
    coordinateKind === 'float64' ? new arrow.Float64() : new arrow.Float32();
  const values =
    coordinateKind === 'float64'
      ? new Float64Array(pathCount * pointCount * 4)
      : new Float32Array(pathCount * pointCount * 4);
  for (let pathIndex = 0; pathIndex < pathCount; pathIndex++) {
    valueOffsets[pathIndex] = pathIndex * pointCount;
    const normalizedPathIndex = pathCount <= 1 ? 0 : pathIndex / (pathCount - 1);
    const baseY = -0.92 + normalizedPathIndex * 1.84;
    const phase = pathIndex * 0.13;
    const pathClusterIndex = pathIndex % 5;
    const pathMeasureRate = 0.58 + pathClusterIndex * 0.16;
    const pathMeasurePhase = (Math.floor(pathIndex / 5) % 4) * 0.08;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
      const coordinateIndex = (pathIndex * pointCount + pointIndex) * 4;
      values[coordinateIndex] = -1.24 + pathProgress * 2.48;
      values[coordinateIndex + 1] =
        baseY +
        Math.sin(pathProgress * 11.5 + phase) * 0.028 +
        Math.cos(pathProgress * 4.2 - phase * 0.55) * 0.014;
      values[coordinateIndex + 2] = 0;
      values[coordinateIndex + 3] = (1 - pathProgress) * pathMeasureRate + pathMeasurePhase;
    }
  }
  valueOffsets[pathCount] = pathCount * pointCount;

  const coordinateType = new arrow.FixedSizeList(
    4,
    new arrow.Field('values', coordinateValueType, false)
  );
  const pathType = new arrow.List(new arrow.Field('coordinates', coordinateType, false));
  const coordinateValueData = new arrow.Data(coordinateValueType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const coordinateData = new arrow.Data(coordinateType, 0, values.length / 4, 0, {}, [
    coordinateValueData
  ]);
  const pathData = new arrow.Data(
    pathType,
    0,
    pathCount,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
  return new arrow.Vector([pathData]) as arrow.Vector<ArrowPathSourceCoordinateType>;
}

function makePathColors(pathCount: number): Uint8Array {
  const colors = new Uint8Array(pathCount * 4);
  for (let pathIndex = 0; pathIndex < pathCount; pathIndex++) {
    const paletteColor = getPathPaletteColor(pathIndex);
    const colorOffset = pathIndex * 4;
    colors[colorOffset] = paletteColor[0];
    colors[colorOffset + 1] = paletteColor[1];
    colors[colorOffset + 2] = paletteColor[2];
    colors[colorOffset + 3] = 220;
  }
  return colors;
}

function makePathWidths(pathCount: number): number[] {
  return Array.from({length: pathCount}, (_, pathIndex) => 0.0022 + (pathIndex % 7) * 0.00072);
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

function setMetricText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
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
