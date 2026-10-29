// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';

/** Byte stride of one camera-dependent Gaussian projection owned by its renderer. */
export const GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH = 48;

/** Padded byte size of the camera, styling, and preserved-batch projection uniforms. */
export const GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH = 128;

/** Padded byte size of view-dependent harmonics and source-semantic selection controls. */
export const GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH = 48;

/** Sentinel sorted after every valid 16-bit, back-to-front Gaussian depth key. */
export const GPU_SPLAT_INVALID_DEPTH_KEY = 0xffff;

/** Projection uses exactly eight storage bindings, the guaranteed WebGPU minimum. */
export const GPU_SPLAT_PROJECTION_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
    {name: 'scales', type: 'read-only-storage', group: 0, location: 1},
    {name: 'rotations', type: 'read-only-storage', group: 0, location: 2},
    {name: 'colors', type: 'read-only-storage', group: 0, location: 3},
    {name: 'opacities', type: 'read-only-storage', group: 0, location: 4},
    {name: 'projectedRecords', type: 'storage', group: 0, location: 5},
    {name: 'depthKeys', type: 'storage', group: 0, location: 6},
    {name: 'drawCommands', type: 'storage', group: 0, location: 7},
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 8}
  ]
} satisfies ShaderLayout;

/** Optional directional-radiance and semantic filtering stay below the eight-buffer minimum. */
export const GPU_SPLAT_FEATURE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
    {name: 'sphericalHarmonics', type: 'read-only-storage', group: 0, location: 1},
    {name: 'semanticIds', type: 'read-only-storage', group: 0, location: 2},
    {name: 'semanticSelections', type: 'read-only-storage', group: 0, location: 3},
    {name: 'projectedRecords', type: 'storage', group: 0, location: 4},
    {name: 'depthKeys', type: 'storage', group: 0, location: 5},
    {name: 'drawCommands', type: 'storage', group: 0, location: 6},
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 7},
    {name: 'featureUniforms', type: 'uniform', group: 0, location: 8}
  ]
} satisfies ShaderLayout;

/** Globally sorted projected records render in one draw without binding source batches. */
export const GPU_SPLAT_RENDER_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'projectedRecords', type: 'read-only-storage', group: 0, location: 1},
    {name: 'sortedIds', type: 'read-only-storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

const GPU_SPLAT_GRAPH_SHARED = /* wgsl */ `\
struct GraphSplatUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  radiusScale: f32,
  alphaScale: f32,
  alphaCutoff: f32,
  screenSizeCutoffPixels: f32,
  gaussianSupportRadius: f32,
  kernel2DSize: f32,
  maxScreenSpaceSplatSize: f32,
  exposure: f32,
  toneMapping: u32,
  batchOffset: u32,
  rowCount: u32,
  isFloatColor: u32,
};

struct ProjectedSplat {
  clipCenter: vec4<f32>,
  axis0: vec2<f32>,
  axis1: vec2<f32>,
  color: vec4<f32>,
};
`;

/** Projects one preserved source batch, culls invisible rows, and publishes global sort keys. */
export const GPU_SPLAT_PROJECTION_SHADER = /* wgsl */ `\
${GPU_SPLAT_GRAPH_SHARED}

const INVALID_DEPTH_KEY: u32 = 65535u;
const MAXIMUM_VALID_DEPTH_KEY: u32 = 65534u;
const MINIMUM_PROJECTABLE_W: f32 = 0.000001;
const MAXIMUM_FINITE_FLOAT: f32 = 3.402823466e38;

@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> scales: array<f32>;
@group(0) @binding(2) var<storage, read> rotations: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> colors: array<u32>;
@group(0) @binding(4) var<storage, read> opacities: array<f32>;
@group(0) @binding(5) var<storage, read_write> projectedRecords: array<ProjectedSplat>;
@group(0) @binding(6) var<storage, read_write> depthKeys: array<u32>;
@group(0) @binding(7) var<storage, read_write> drawCommands: array<atomic<u32>>;
@group(0) @binding(8) var<uniform> graphUniforms: GraphSplatUniforms;

fn isFiniteSplatValue(value: f32) -> bool {
  return abs(value) <= MAXIMUM_FINITE_FLOAT;
}

fn isFiniteSplatPosition(position: vec3<f32>) -> bool {
  return isFiniteSplatValue(position.x) &&
    isFiniteSplatValue(position.y) &&
    isFiniteSplatValue(position.z);
}

fn clearProjectedSplat(rowIndex: u32) {
  projectedRecords[rowIndex] = ProjectedSplat(
    vec4<f32>(0.0, 0.0, 2.0, 1.0),
    vec2<f32>(0.0),
    vec2<f32>(0.0),
    vec4<f32>(0.0)
  );
  depthKeys[rowIndex] = INVALID_DEPTH_KEY;
}

fn getProjectedScreenPosition(position: vec3<f32>) -> vec2<f32> {
  let clipPosition = graphUniforms.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  let inverseClipW = select(
    0.0,
    1.0 / clipPosition.w,
    abs(clipPosition.w) > MINIMUM_PROJECTABLE_W
  );
  return vec2<f32>(
    (clipPosition.x * inverseClipW * 0.5 + 0.5) * graphUniforms.viewportSize.x,
    (0.5 - clipPosition.y * inverseClipW * 0.5) * graphUniforms.viewportSize.y
  );
}

fn getProjectedRotation(quaternion: vec4<f32>) -> mat3x3<f32> {
  let quaternionLength = length(quaternion);
  let normalized = select(
    vec4<f32>(1.0, 0.0, 0.0, 0.0),
    quaternion / max(quaternionLength, MINIMUM_PROJECTABLE_W),
    quaternionLength > MINIMUM_PROJECTABLE_W
  );
  let quaternionW = normalized.x;
  let quaternionX = normalized.y;
  let quaternionY = normalized.z;
  let quaternionZ = normalized.w;
  return mat3x3<f32>(
    vec3<f32>(
      1.0 - 2.0 * (quaternionY * quaternionY + quaternionZ * quaternionZ),
      2.0 * (quaternionX * quaternionY + quaternionW * quaternionZ),
      2.0 * (quaternionX * quaternionZ - quaternionW * quaternionY)
    ),
    vec3<f32>(
      2.0 * (quaternionX * quaternionY - quaternionW * quaternionZ),
      1.0 - 2.0 * (quaternionX * quaternionX + quaternionZ * quaternionZ),
      2.0 * (quaternionY * quaternionZ + quaternionW * quaternionX)
    ),
    vec3<f32>(
      2.0 * (quaternionX * quaternionZ + quaternionW * quaternionY),
      2.0 * (quaternionY * quaternionZ - quaternionW * quaternionX),
      1.0 - 2.0 * (quaternionX * quaternionX + quaternionY * quaternionY)
    )
  );
}

fn getProjectedColor(rowIndex: u32) -> vec4<f32> {
  if (graphUniforms.isFloatColor != 0u) {
    let colorIndex = rowIndex * 4u;
    return vec4<f32>(
      bitcast<f32>(colors[colorIndex]),
      bitcast<f32>(colors[colorIndex + 1u]),
      bitcast<f32>(colors[colorIndex + 2u]),
      bitcast<f32>(colors[colorIndex + 3u])
    );
  }

  let packedColor = colors[rowIndex];
  return vec4<f32>(
    f32(packedColor & 255u),
    f32((packedColor >> 8u) & 255u),
    f32((packedColor >> 16u) & 255u),
    f32((packedColor >> 24u) & 255u)
  ) / 255.0;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let batchRowIndex = globalInvocationId.x;
  if (batchRowIndex >= graphUniforms.rowCount) {
    return;
  }

  let projectedRowIndex = graphUniforms.batchOffset + batchRowIndex;
  let componentIndex = batchRowIndex * 3u;
  let position = vec3<f32>(
    positions[componentIndex],
    positions[componentIndex + 1u],
    positions[componentIndex + 2u]
  );
  if (!isFiniteSplatPosition(position)) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let clipCenter = graphUniforms.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  if (
    !isFiniteSplatValue(clipCenter.x) ||
    !isFiniteSplatValue(clipCenter.y) ||
    !isFiniteSplatValue(clipCenter.z) ||
    !isFiniteSplatValue(clipCenter.w) ||
    clipCenter.w <= MINIMUM_PROJECTABLE_W ||
    clipCenter.z < -clipCenter.w ||
    clipCenter.z > clipCenter.w
  ) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let color = getProjectedColor(batchRowIndex);
  let alpha = color.a * opacities[batchRowIndex] * graphUniforms.alphaScale;
  if (!isFiniteSplatValue(alpha) || alpha < graphUniforms.alphaCutoff) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let scale = vec3<f32>(
    scales[componentIndex],
    scales[componentIndex + 1u],
    scales[componentIndex + 2u]
  );
  if (!isFiniteSplatPosition(scale)) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let center = getProjectedScreenPosition(position);
  let rotationMatrix = getProjectedRotation(rotations[batchRowIndex]);
  let delta0 = getProjectedScreenPosition(position + rotationMatrix[0] * scale.x) - center;
  let delta1 = getProjectedScreenPosition(position + rotationMatrix[1] * scale.y) - center;
  let delta2 = getProjectedScreenPosition(position + rotationMatrix[2] * scale.z) - center;
  let kernelVariance = graphUniforms.kernel2DSize * graphUniforms.kernel2DSize;
  let covariance00 = dot(
    vec3<f32>(delta0.x, delta1.x, delta2.x),
    vec3<f32>(delta0.x, delta1.x, delta2.x)
  ) + kernelVariance;
  let covariance01 = dot(
    vec3<f32>(delta0.x, delta1.x, delta2.x),
    vec3<f32>(delta0.y, delta1.y, delta2.y)
  );
  let covariance11 = dot(
    vec3<f32>(delta0.y, delta1.y, delta2.y),
    vec3<f32>(delta0.y, delta1.y, delta2.y)
  ) + kernelVariance;
  let halfTrace = (covariance00 + covariance11) * 0.5;
  let halfDifference = (covariance00 - covariance11) * 0.5;
  let discriminant = sqrt(max(halfDifference * halfDifference + covariance01 * covariance01, 0.0));
  let firstEigenvalue = max(halfTrace + discriminant, 0.0);
  let secondEigenvalue = max(halfTrace - discriminant, 0.0);
  var firstDirection = vec2<f32>(covariance01, firstEigenvalue - covariance00);
  if (length(firstDirection) <= MINIMUM_PROJECTABLE_W) {
    firstDirection = vec2<f32>(firstEigenvalue - covariance11, covariance01);
  }
  if (length(firstDirection) <= MINIMUM_PROJECTABLE_W) {
    firstDirection = vec2<f32>(1.0, 0.0);
  }
  firstDirection = normalize(firstDirection);
  let secondDirection = vec2<f32>(-firstDirection.y, firstDirection.x);
  let firstAxisLength = max(sqrt(firstEigenvalue), 0.001);
  let secondAxisLength = max(sqrt(secondEigenvalue), 0.001);
  let maximumAxisLength = max(firstAxisLength, secondAxisLength);
  if (
    !isFiniteSplatValue(maximumAxisLength) ||
    maximumAxisLength * graphUniforms.radiusScale < graphUniforms.screenSizeCutoffPixels
  ) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let clampScale = min(
    max(graphUniforms.maxScreenSpaceSplatSize, 0.001) / maximumAxisLength,
    1.0
  );
  let supportScale = graphUniforms.gaussianSupportRadius * graphUniforms.radiusScale * clampScale;
  let axis0 = firstDirection * firstAxisLength * supportScale;
  let axis1 = secondDirection * secondAxisLength * supportScale;
  let screenExtent = abs(axis0) + abs(axis1);
  if (
    center.x + screenExtent.x < 0.0 ||
    center.y + screenExtent.y < 0.0 ||
    center.x - screenExtent.x > graphUniforms.viewportSize.x ||
    center.y - screenExtent.y > graphUniforms.viewportSize.y
  ) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }

  let normalizedDepth = clamp(clipCenter.z / clipCenter.w * 0.5 + 0.5, 0.0, 1.0);
  let quantizedDepth = u32(round(normalizedDepth * f32(MAXIMUM_VALID_DEPTH_KEY)));
  depthKeys[projectedRowIndex] = MAXIMUM_VALID_DEPTH_KEY - quantizedDepth;
  projectedRecords[projectedRowIndex] = ProjectedSplat(
    clipCenter,
    axis0,
    axis1,
    vec4<f32>(color.rgb, alpha)
  );
  atomicAdd(&drawCommands[1u], 1u);
}
`;

/** Applies higher-order SH and semantic visibility directly to GPU-projected source records. */
export const GPU_SPLAT_FEATURE_SHADER = /* wgsl */ `\
${GPU_SPLAT_GRAPH_SHARED}

struct GraphSplatFeatureUniforms {
  cameraPosition: vec3<f32>,
  sphericalHarmonicsDegree: u32,
  sphericalHarmonicsStride: u32,
  hasSemanticIds: u32,
  includeCount: u32,
  excludeCount: u32,
  hasIncludeSelection: u32,
  includeUnlabeled: u32,
  semanticFilterActive: u32,
  padding: u32,
};

const INVALID_FEATURE_DEPTH_KEY: u32 = 65535u;

@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> sphericalHarmonics: array<f32>;
@group(0) @binding(2) var<storage, read> semanticIds: array<u32>;
@group(0) @binding(3) var<storage, read> semanticSelections: array<u32>;
@group(0) @binding(4) var<storage, read_write> projectedRecords: array<ProjectedSplat>;
@group(0) @binding(5) var<storage, read_write> depthKeys: array<u32>;
@group(0) @binding(6) var<storage, read_write> drawCommands: array<atomic<u32>>;
@group(0) @binding(7) var<uniform> graphUniforms: GraphSplatUniforms;
@group(0) @binding(8) var<uniform> featureUniforms: GraphSplatFeatureUniforms;

fn hasSelectedSemantic(semanticId: u32, offset: u32, count: u32) -> bool {
  for (var selectionIndex = 0u; selectionIndex < count; selectionIndex++) {
    if (semanticSelections[offset + selectionIndex] == semanticId) {
      return true;
    }
  }
  return false;
}

fn acceptsProjectedSemantic(batchRowIndex: u32) -> bool {
  if (featureUniforms.semanticFilterActive == 0u) {
    return true;
  }
  if (featureUniforms.hasSemanticIds == 0u) {
    return featureUniforms.includeUnlabeled != 0u;
  }

  let semanticId = semanticIds[batchRowIndex];
  if (
    featureUniforms.hasIncludeSelection != 0u &&
    !hasSelectedSemantic(semanticId, 0u, featureUniforms.includeCount)
  ) {
    return false;
  }
  return !hasSelectedSemantic(
    semanticId,
    featureUniforms.includeCount,
    featureUniforms.excludeCount
  );
}

fn getGraphSphericalHarmonicBasis(basisIndex: u32, direction: vec3<f32>) -> f32 {
  let directionXX = direction.x * direction.x;
  let directionYY = direction.y * direction.y;
  let directionZZ = direction.z * direction.z;
  switch basisIndex {
    case 0u: { return -0.4886025119029199 * direction.y; }
    case 1u: { return 0.4886025119029199 * direction.z; }
    case 2u: { return -0.4886025119029199 * direction.x; }
    case 3u: { return 1.0925484305920792 * direction.x * direction.y; }
    case 4u: { return -1.0925484305920792 * direction.y * direction.z; }
    case 5u: { return 0.31539156525252005 * (2.0 * directionZZ - directionXX - directionYY); }
    case 6u: { return -1.0925484305920792 * direction.x * direction.z; }
    case 7u: { return 0.5462742152960396 * (directionXX - directionYY); }
    case 8u: { return -0.5900435899266435 * direction.y * (3.0 * directionXX - directionYY); }
    case 9u: { return 2.890611442640554 * direction.x * direction.y * direction.z; }
    case 10u: { return -0.4570457994644658 * direction.y * (4.0 * directionZZ - directionXX - directionYY); }
    case 11u: { return 0.3731763325901154 * direction.z * (2.0 * directionZZ - 3.0 * directionXX - 3.0 * directionYY); }
    case 12u: { return -0.4570457994644658 * direction.x * (4.0 * directionZZ - directionXX - directionYY); }
    case 13u: { return 1.445305721320277 * direction.z * (directionXX - directionYY); }
    case 14u: { return -0.5900435899266435 * direction.x * (directionXX - 3.0 * directionYY); }
    default: { return 0.0; }
  }
}

fn evaluateGraphSphericalHarmonics(color: vec3<f32>, batchRowIndex: u32) -> vec3<f32> {
  let degree = featureUniforms.sphericalHarmonicsDegree;
  if (degree == 0u) {
    return color;
  }

  let positionOffset = batchRowIndex * 3u;
  let position = vec3<f32>(
    positions[positionOffset],
    positions[positionOffset + 1u],
    positions[positionOffset + 2u]
  );
  let direction = position - featureUniforms.cameraPosition;
  let directionLength = length(direction);
  if (directionLength <= 0.000001) {
    return color;
  }

  let normalizedDirection = direction / directionLength;
  let basisCount = (degree + 1u) * (degree + 1u) - 1u;
  var evaluatedColor = color;
  for (var basisIndex = 0u; basisIndex < basisCount; basisIndex++) {
    let coefficientOffset =
      batchRowIndex * featureUniforms.sphericalHarmonicsStride + basisIndex * 3u;
    let coefficients = vec3<f32>(
      sphericalHarmonics[coefficientOffset],
      sphericalHarmonics[coefficientOffset + 1u],
      sphericalHarmonics[coefficientOffset + 2u]
    );
    evaluatedColor += coefficients *
      getGraphSphericalHarmonicBasis(basisIndex, normalizedDirection);
  }
  return evaluatedColor;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let batchRowIndex = globalInvocationId.x;
  if (batchRowIndex >= graphUniforms.rowCount) {
    return;
  }

  let projectedRowIndex = graphUniforms.batchOffset + batchRowIndex;
  if (depthKeys[projectedRowIndex] == INVALID_FEATURE_DEPTH_KEY) {
    return;
  }
  if (!acceptsProjectedSemantic(batchRowIndex)) {
    projectedRecords[projectedRowIndex].color = vec4<f32>(0.0);
    depthKeys[projectedRowIndex] = INVALID_FEATURE_DEPTH_KEY;
    atomicSub(&drawCommands[1u], 1u);
    return;
  }

  if (featureUniforms.sphericalHarmonicsDegree != 0u) {
    let projectedColor = projectedRecords[projectedRowIndex].color;
    projectedRecords[projectedRowIndex].color = vec4<f32>(
      evaluateGraphSphericalHarmonics(projectedColor.rgb, batchRowIndex),
      projectedColor.a
    );
  }
}
`;

/** Renders globally sorted, preprojected HDR Gaussians without revisiting source batches. */
export const GPU_SPLAT_RENDER_SHADER = /* wgsl */ `\
${GPU_SPLAT_GRAPH_SHARED}

@group(0) @binding(0) var<uniform> graphUniforms: GraphSplatUniforms;
@group(0) @binding(1) var<storage, read> projectedRecords: array<ProjectedSplat>;
@group(0) @binding(2) var<storage, read> sortedIds: array<u32>;

struct GraphSplatFragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) gaussianCoordinate: vec2<f32>,
  @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> GraphSplatFragmentInputs {
  let corners = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );
  let corner = corners[vertexIndex];
  let projected = projectedRecords[sortedIds[instanceIndex]];
  let screenOffset = corner.x * projected.axis0 + corner.y * projected.axis1;
  let clipOffset = vec2<f32>(
    screenOffset.x * 2.0 / max(graphUniforms.viewportSize.x, 1.0),
    -screenOffset.y * 2.0 / max(graphUniforms.viewportSize.y, 1.0)
  ) * projected.clipCenter.w;

  var output: GraphSplatFragmentInputs;
  output.position = vec4<f32>(
    projected.clipCenter.xy + clipOffset,
    projected.clipCenter.z,
    projected.clipCenter.w
  );
  output.gaussianCoordinate = corner * graphUniforms.gaussianSupportRadius;
  output.color = projected.color;
  return output;
}

@fragment
fn fragmentMain(input: GraphSplatFragmentInputs) -> @location(0) vec4<f32> {
  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.color.a * gaussianWeight;
  if (alpha < graphUniforms.alphaCutoff) {
    discard;
  }

  let linearColor = max(input.color.rgb * graphUniforms.exposure, vec3<f32>(0.0));
  let mappedColor = select(
    linearColor,
    linearColor / (vec3<f32>(1.0) + linearColor),
    graphUniforms.toneMapping == 1u
  );
  return vec4<f32>(mappedColor, alpha);
}
`;
