// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import {ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';

export const PRECISION_PATH_SHADER_LAYOUT = {
  attributes: [
    {name: 'segmentStartPositions', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentEndPositions', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentPreviousPositions', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentNextPositions', location: 3, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentFlags', location: 4, type: 'u32', stepMode: 'instance'},
    {name: 'segmentStartColors', location: 5, type: 'u32', stepMode: 'instance'},
    {name: 'segmentEndColors', location: 6, type: 'u32', stepMode: 'instance'},
    {name: 'widths', location: 7, type: 'f32', stepMode: 'instance'},
    {name: 'pathViewOrigins', location: 8, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const WGSL_SHADER = /* wgsl */ `\
struct PrecisionViewportUniforms {
  center : vec2<f32>,
  worldScale : vec2<f32>,
  paneOffset : vec2<f32>,
  usePreparedOrigins : f32,
  miterLimit : f32,
};

@group(0) @binding(auto) var<uniform> precisionViewport : PrecisionViewportUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPositions : vec4<f32>,
  @location(1) segmentEndPositions : vec4<f32>,
  @location(2) segmentPreviousPositions : vec4<f32>,
  @location(3) segmentNextPositions : vec4<f32>,
  @location(4) segmentFlags : u32,
  @location(5) segmentStartColors : u32,
  @location(6) segmentEndColors : u32,
  @location(7) widths : f32,
  @location(8) pathViewOrigins : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) cornerOffset : vec2<f32>,
  @location(2) miterLength : f32,
  @location(3) pathPosition : vec2<f32>,
  @location(4) pathLength : f32,
  @location(5) jointType : f32,
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
  var jointType = 0.0;
  if (isCap) {
    let capOffset = direction * 4.0 * flipIfTrue(isStartCap);
    cornerOffset = mix(perpendicular * sideOfPath, capOffset, isJoint);
    jointType = 1.0;
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
  let extrusion = computePathExtrusion(
    previousPoint,
    currentPoint,
    nextPoint,
    segmentVertex,
    max(inputs.widths * 0.5, 0.1),
    inputs.segmentFlags
  );
  let sourcePosition = currentPoint + extrusion.offset;
  let castClipPosition =
    ((currentPoint - precisionViewport.center) + extrusion.offset) *
    precisionViewport.worldScale +
    precisionViewport.paneOffset;
  let preparedClipPosition =
    inputs.pathViewOrigins.xy + sourcePosition * precisionViewport.worldScale;
  let clipPosition = mix(
    castClipPosition,
    preparedClipPosition,
    precisionViewport.usePreparedOrigins
  );
  let color = mix(
    unpack4x8unorm(inputs.segmentStartColors),
    unpack4x8unorm(inputs.segmentEndColors),
    segmentVertex.x
  );

  outputs.Position = vec4<f32>(clipPosition, 0.0, 1.0);
  outputs.color = vec4<f32>(min(color.rgb * 1.12 + vec3<f32>(0.02), vec3<f32>(1.0)), color.a);
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
    if (inputs.jointType < 0.5 && inputs.miterLength > precisionViewport.miterLimit + 1.0) {
      discard;
    }
  }
  return inputs.color;
}
`;

export const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform precisionViewportUniforms {
  vec2 center;
  vec2 worldScale;
  vec2 paneOffset;
  float usePreparedOrigins;
  float miterLimit;
} precisionViewport;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in vec4 segmentPreviousPositions;
in vec4 segmentNextPositions;
in uint segmentFlags;
in uint segmentStartColors;
in uint segmentEndColors;
in float widths;
in vec4 pathViewOrigins;

out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;

const float PATH_EPSILON = 0.00001;
const uint PATH_SEGMENT_FIRST = 1u;
const uint PATH_SEGMENT_LAST = 2u;
const uint PATH_SEGMENT_CLOSED = 4u;

struct PathExtrusion {
  vec2 offset;
  vec2 cornerOffset;
  float miterLength;
  vec2 pathPosition;
  float pathLength;
  float jointType;
};

vec2 getSegmentVertex(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(0.0, 0.0); }
  if (vertexIndex == 1) { return vec2(0.0, -1.0); }
  if (vertexIndex == 2) { return vec2(0.0, 1.0); }
  if (vertexIndex == 3) { return vec2(0.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  if (vertexIndex == 5) { return vec2(0.0, 1.0); }
  if (vertexIndex == 6) { return vec2(0.0, -1.0); }
  if (vertexIndex == 7) { return vec2(1.0, -1.0); }
  if (vertexIndex == 8) { return vec2(1.0, 1.0); }
  if (vertexIndex == 9) { return vec2(1.0, -1.0); }
  if (vertexIndex == 10) { return vec2(1.0, 0.0); }
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
  uint inputSegmentFlags
) {
  bool isEnd = segmentVertex.x > 0.5;
  float sideOfPath = segmentVertex.y;
  float isJoint = abs(sideOfPath) < 0.5 ? 1.0 : 0.0;
  float normalizedWidth = max(halfWidth, PATH_EPSILON);
  vec2 deltaA = (currentPoint - previousPoint) / normalizedWidth;
  vec2 deltaB = (nextPoint - currentPoint) / normalizedWidth;
  float lenA = length(deltaA);
  float lenB = length(deltaB);
  vec2 dirA = deltaA / max(lenA, PATH_EPSILON);
  vec2 dirB = deltaB / max(lenB, PATH_EPSILON);
  vec2 perpA = vec2(-dirA.y, dirA.x);
  vec2 perpB = vec2(-dirB.y, dirB.x);
  vec2 tangentBasis = dirA + dirB;
  float tangentLength = length(tangentBasis);
  vec2 tangent = tangentLength > PATH_EPSILON ?
    tangentBasis / max(tangentLength, PATH_EPSILON) :
    perpA;
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
  bool isFirst = (inputSegmentFlags & PATH_SEGMENT_FIRST) != 0u;
  bool isLast = (inputSegmentFlags & PATH_SEGMENT_LAST) != 0u;
  bool isClosed = (inputSegmentFlags & PATH_SEGMENT_CLOSED) != 0u;
  bool isStartCap = lenA <= PATH_EPSILON || (!isEnd && isFirst && !isClosed);
  bool isEndCap = lenB <= PATH_EPSILON || (isEnd && isLast && !isClosed);
  bool isCap = isStartCap || isEndCap;
  float jointType = 0.0;
  if (isCap) {
    vec2 capOffset = direction * 4.0 * flipIfTrue(isStartCap);
    cornerOffset = mix(perpendicular * sideOfPath, capOffset, isJoint);
    jointType = 1.0;
  }
  float miterLength = dot(cornerOffset, miterVector * turnDirection);
  if (isCap) {
    miterLength = isJoint;
  }
  vec2 offsetFromStart = cornerOffset + deltaA * (isEnd ? 1.0 : 0.0);
  PathExtrusion extrusion;
  extrusion.offset = cornerOffset * halfWidth;
  extrusion.cornerOffset = cornerOffset;
  extrusion.miterLength = miterLength;
  extrusion.pathPosition = vec2(dot(offsetFromStart, perpendicular), dot(offsetFromStart, direction));
  extrusion.pathLength = pathLength;
  extrusion.jointType = jointType;
  return extrusion;
}

vec4 unpackPathColor(uint colorWord) {
  return vec4(
    float(colorWord & 255u),
    float((colorWord >> 8u) & 255u),
    float((colorWord >> 16u) & 255u),
    float((colorWord >> 24u) & 255u)
  ) / 255.0;
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
  PathExtrusion extrusion = computePathExtrusion(
    previousPoint,
    currentPoint,
    nextPoint,
    segmentVertex,
    max(widths * 0.5, 0.1),
    segmentFlags
  );
  vec2 sourcePosition = currentPoint + extrusion.offset;
  vec2 castClipPosition =
    ((currentPoint - precisionViewport.center) + extrusion.offset) *
    precisionViewport.worldScale +
    precisionViewport.paneOffset;
  vec2 preparedClipPosition =
    pathViewOrigins.xy + sourcePosition * precisionViewport.worldScale;
  vec2 clipPosition = mix(
    castClipPosition,
    preparedClipPosition,
    precisionViewport.usePreparedOrigins
  );
  vec4 pathColor = mix(
    unpackPathColor(segmentStartColors),
    unpackPathColor(segmentEndColors),
    segmentVertex.x
  );

  gl_Position = vec4(clipPosition, 0.0, 1.0);
  vColor = vec4(min(pathColor.rgb * 1.12 + vec3(0.02), vec3(1.0)), pathColor.a);
  vCornerOffset = extrusion.cornerOffset;
  vMiterLength = extrusion.miterLength;
  vPathPosition = extrusion.pathPosition;
  vPathLength = extrusion.pathLength;
  vJointType = extrusion.jointType;
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

layout(std140) uniform precisionViewportUniforms {
  vec2 center;
  vec2 worldScale;
  vec2 paneOffset;
  float usePreparedOrigins;
  float miterLimit;
} precisionViewport;

in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;

out vec4 fragColor;

void main() {
  if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
    if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
      discard;
    }
    if (vJointType < 0.5 && vMiterLength > precisionViewport.miterLimit + 1.0) {
      discard;
    }
  }
  fragColor = vColor;
}
`;

export type PrecisionViewportUniforms = {
  center: [number, number];
  worldScale: [number, number];
  paneOffset: [number, number];
  usePreparedOrigins: number;
  miterLimit: number;
};

export const precisionViewport: ShaderModule<PrecisionViewportUniforms> = {
  name: 'precisionViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    worldScale: 'vec2<f32>',
    paneOffset: 'vec2<f32>',
    usePreparedOrigins: 'f32',
    miterLimit: 'f32'
  },
  defaultUniforms: {
    center: [0, 0],
    worldScale: [1, 1],
    paneOffset: [0, 0],
    usePreparedOrigins: 0,
    miterLimit: 4
  }
};

export function createFloat64PrecisionShaderInputs(): ShaderInputs<{
  precisionViewport: typeof precisionViewport.props;
}> {
  return new ShaderInputs<{precisionViewport: typeof precisionViewport.props}>({
    precisionViewport
  });
}
