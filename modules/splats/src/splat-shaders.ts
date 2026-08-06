// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

/** Shared camera, size, and opacity controls consumed by Gaussian splat shaders. */
export type SplatUniforms = {
  modelViewProjectionMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];
  viewportSize: [number, number];
  radiusScale: number;
  alphaScale: number;
  alphaCutoff: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
  kernel2DSize: number;
  maxScreenSpaceSplatSize: number;
  sortedOffset: number;
  exposure: number;
  toneMapping: number;
};

/** Uniform module shared by WebGPU storage and WebGL2 attribute-backed splat models. */
export const splatUniforms = {
  name: 'splat',
  uniformTypes: {
    modelViewProjectionMatrix: 'mat4x4<f32>',
    viewportSize: 'vec2<f32>',
    radiusScale: 'f32',
    alphaScale: 'f32',
    alphaCutoff: 'f32',
    screenSizeCutoffPixels: 'f32',
    gaussianSupportRadius: 'f32',
    kernel2DSize: 'f32',
    maxScreenSpaceSplatSize: 'f32',
    sortedOffset: 'u32',
    exposure: 'f32',
    toneMapping: 'u32'
  }
} satisfies ShaderModule<SplatUniforms>;

/** Instanced source attributes used by the WebGL2 fallback and null-device tests. */
export const SPLAT_ATTRIBUTE_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>', stepMode: 'instance'},
    {name: 'scales', location: 1, type: 'vec3<f32>', stepMode: 'instance'},
    {name: 'rotations', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'colors', location: 3, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'opacities', location: 4, type: 'f32', stepMode: 'instance'},
    {name: 'rowIndices', location: 5, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

/** Storage-buffer shader layout used by the WebGPU render path. */
export const SPLAT_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'splatUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'splatPositions', type: 'read-only-storage', group: 0, location: 1},
    {name: 'splatScales', type: 'read-only-storage', group: 0, location: 2},
    {name: 'splatRotations', type: 'read-only-storage', group: 0, location: 3},
    {name: 'splatColors', type: 'read-only-storage', group: 0, location: 4},
    {name: 'splatOpacities', type: 'read-only-storage', group: 0, location: 5},
    {name: 'splatRowIndices', type: 'read-only-storage', group: 0, location: 6},
    {name: 'splatSortedIndices', type: 'read-only-storage', group: 0, location: 7}
  ]
} satisfies ShaderLayout;

const SPLAT_WGSL_SHARED = /* wgsl */ `\
struct SplatUniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
  viewportSize : vec2<f32>,
  radiusScale : f32,
  alphaScale : f32,
  alphaCutoff : f32,
  screenSizeCutoffPixels : f32,
  gaussianSupportRadius : f32,
  kernel2DSize : f32,
  maxScreenSpaceSplatSize : f32,
  sortedOffset : u32,
  exposure : f32,
  toneMapping : u32,
};

@group(0) @binding(auto) var<uniform> splat : SplatUniforms;

struct SplatFragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) gaussianCoordinate : vec2<f32>,
  @location(1) color : vec4<f32>,
};

fn getSplatScreenPosition(position : vec3<f32>) -> vec2<f32> {
  let clipPosition = splat.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  let inverseW = select(0.0, 1.0 / clipPosition.w, abs(clipPosition.w) > 0.000001);
  return vec2<f32>(
    (clipPosition.x * inverseW * 0.5 + 0.5) * splat.viewportSize.x,
    (0.5 - clipPosition.y * inverseW * 0.5) * splat.viewportSize.y
  );
}

fn getSplatRotation(quaternion : vec4<f32>) -> mat3x3<f32> {
  let quaternionLength = length(quaternion);
  let normalized = select(vec4<f32>(1.0, 0.0, 0.0, 0.0), quaternion / max(quaternionLength, 0.000001), quaternionLength > 0.000001);
  let quaternionW = normalized.x;
  let quaternionX = normalized.y;
  let quaternionY = normalized.z;
  let quaternionZ = normalized.w;
  return mat3x3<f32>(
    vec3<f32>(1.0 - 2.0 * (quaternionY * quaternionY + quaternionZ * quaternionZ), 2.0 * (quaternionX * quaternionY + quaternionW * quaternionZ), 2.0 * (quaternionX * quaternionZ - quaternionW * quaternionY)),
    vec3<f32>(2.0 * (quaternionX * quaternionY - quaternionW * quaternionZ), 1.0 - 2.0 * (quaternionX * quaternionX + quaternionZ * quaternionZ), 2.0 * (quaternionY * quaternionZ + quaternionW * quaternionX)),
    vec3<f32>(2.0 * (quaternionX * quaternionZ + quaternionW * quaternionY), 2.0 * (quaternionY * quaternionZ - quaternionW * quaternionX), 1.0 - 2.0 * (quaternionX * quaternionX + quaternionY * quaternionY))
  );
}

fn projectSplatVertex(
  vertexIndex : u32,
  position : vec3<f32>,
  scale : vec3<f32>,
  rotation : vec4<f32>,
  color : vec4<f32>,
  opacity : f32
) -> SplatFragmentInputs {
  let corners = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0)
  );
  let corner = corners[vertexIndex];
  let center = getSplatScreenPosition(position);
  let rotationMatrix = getSplatRotation(rotation);
  let delta0 = getSplatScreenPosition(position + rotationMatrix[0] * scale.x) - center;
  let delta1 = getSplatScreenPosition(position + rotationMatrix[1] * scale.y) - center;
  let delta2 = getSplatScreenPosition(position + rotationMatrix[2] * scale.z) - center;
  let kernelVariance = splat.kernel2DSize * splat.kernel2DSize;
  let covariance00 = dot(vec3<f32>(delta0.x, delta1.x, delta2.x), vec3<f32>(delta0.x, delta1.x, delta2.x)) + kernelVariance;
  let covariance01 = dot(vec3<f32>(delta0.x, delta1.x, delta2.x), vec3<f32>(delta0.y, delta1.y, delta2.y));
  let covariance11 = dot(vec3<f32>(delta0.y, delta1.y, delta2.y), vec3<f32>(delta0.y, delta1.y, delta2.y)) + kernelVariance;
  let halfTrace = (covariance00 + covariance11) * 0.5;
  let halfDifference = (covariance00 - covariance11) * 0.5;
  let discriminant = sqrt(max(halfDifference * halfDifference + covariance01 * covariance01, 0.0));
  let firstEigenvalue = max(halfTrace + discriminant, 0.0);
  let secondEigenvalue = max(halfTrace - discriminant, 0.0);
  var firstDirection = vec2<f32>(covariance01, firstEigenvalue - covariance00);
  if (length(firstDirection) <= 0.000001) {
    firstDirection = vec2<f32>(firstEigenvalue - covariance11, covariance01);
  }
  if (length(firstDirection) <= 0.000001) {
    firstDirection = vec2<f32>(1.0, 0.0);
  }
  firstDirection = normalize(firstDirection);
  let secondDirection = vec2<f32>(-firstDirection.y, firstDirection.x);
  let firstAxisLength = max(sqrt(firstEigenvalue), 0.001);
  let secondAxisLength = max(sqrt(secondEigenvalue), 0.001);
  let maximumAxisLength = max(firstAxisLength, secondAxisLength);
  let clampScale = min(max(splat.maxScreenSpaceSplatSize, 0.001) / maximumAxisLength, 1.0);
  let supportScale = splat.gaussianSupportRadius * splat.radiusScale * clampScale;
  let screenOffset = (corner.x * firstDirection * firstAxisLength + corner.y * secondDirection * secondAxisLength) * supportScale;
  let clipCenter = splat.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  let clipOffset = vec2<f32>(screenOffset.x * 2.0 / max(splat.viewportSize.x, 1.0), -screenOffset.y * 2.0 / max(splat.viewportSize.y, 1.0)) * clipCenter.w;
  var output : SplatFragmentInputs;
  output.position = vec4<f32>(clipCenter.xy + clipOffset, clipCenter.z, clipCenter.w);
  output.gaussianCoordinate = corner * splat.gaussianSupportRadius;
  let visible = select(0.0, 1.0, maximumAxisLength * splat.radiusScale >= splat.screenSizeCutoffPixels);
  output.color = vec4<f32>(color.rgb, color.a * opacity * splat.alphaScale * visible);
  return output;
}

@fragment
fn fragmentMain(input : SplatFragmentInputs) -> @location(0) vec4<f32> {
  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.color.a * gaussianWeight;
  if (alpha < splat.alphaCutoff) {
    discard;
  }
  let linearColor = max(input.color.rgb * splat.exposure, vec3<f32>(0.0));
  let mappedColor = select(
    linearColor,
    linearColor / (vec3<f32>(1.0) + linearColor),
    splat.toneMapping == 1u
  );
  return vec4<f32>(mappedColor, alpha);
}
`;

/** WebGPU vertex shader that consumes source vectors directly through storage buffers. */
export const SPLAT_STORAGE_WGSL_SHADER = /* wgsl */ `\
${SPLAT_WGSL_SHARED}

@group(0) @binding(auto) var<storage, read> splatPositions : array<f32>;
@group(0) @binding(auto) var<storage, read> splatScales : array<f32>;
@group(0) @binding(auto) var<storage, read> splatRotations : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> splatColors : array<u32>;
@group(0) @binding(auto) var<storage, read> splatOpacities : array<f32>;
@group(0) @binding(auto) var<storage, read> splatRowIndices : array<u32>;
@group(0) @binding(auto) var<storage, read> splatSortedIndices : array<u32>;

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32
) -> SplatFragmentInputs {
  let rowIndex = splatSortedIndices[instanceIndex + splat.sortedOffset];
  let componentIndex = rowIndex * 3u;
  let position = vec3<f32>(splatPositions[componentIndex], splatPositions[componentIndex + 1u], splatPositions[componentIndex + 2u]);
  let scale = vec3<f32>(splatScales[componentIndex], splatScales[componentIndex + 1u], splatScales[componentIndex + 2u]);
  var color : vec4<f32>;
  if (arrayLength(&splatColors) == arrayLength(&splatOpacities) * 4u) {
    let colorIndex = rowIndex * 4u;
    color = vec4<f32>(
      bitcast<f32>(splatColors[colorIndex]),
      bitcast<f32>(splatColors[colorIndex + 1u]),
      bitcast<f32>(splatColors[colorIndex + 2u]),
      bitcast<f32>(splatColors[colorIndex + 3u])
    );
  } else {
    let packedColor = splatColors[rowIndex];
    color = vec4<f32>(
      f32(packedColor & 255u), f32((packedColor >> 8u) & 255u),
      f32((packedColor >> 16u) & 255u), f32((packedColor >> 24u) & 255u)
    ) / 255.0;
  }
  let sourceRowIndex = splatRowIndices[rowIndex];
  _ = sourceRowIndex;
  return projectSplatVertex(vertexIndex, position, scale, splatRotations[rowIndex], color, splatOpacities[rowIndex]);
}
`;

/** WebGPU attribute-backed shader retained for shader inspection and device-independent smoke tests. */
export const SPLAT_ATTRIBUTE_WGSL_SHADER = /* wgsl */ `\
${SPLAT_WGSL_SHARED}

struct SplatVertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec3<f32>,
  @location(1) scales : vec3<f32>,
  @location(2) rotations : vec4<f32>,
  @location(3) colors : vec4<f32>,
  @location(4) opacities : f32,
  @location(5) rowIndices : u32,
};

@vertex
fn vertexMain(input : SplatVertexInputs) -> SplatFragmentInputs {
  _ = input.rowIndices;
  return projectSplatVertex(input.vertexIndex, input.positions, input.scales, input.rotations, input.colors, input.opacities);
}
`;

/** WebGL2 instanced Gaussian vertex shader with anisotropic covariance projection. */
export const SPLAT_VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 positions;
in vec3 scales;
in vec4 rotations;
in vec4 colors;
in float opacities;
in uint rowIndices;

layout(std140) uniform splatUniforms {
  mat4 modelViewProjectionMatrix;
  vec2 viewportSize;
  float radiusScale;
  float alphaScale;
  float alphaCutoff;
  float screenSizeCutoffPixels;
  float gaussianSupportRadius;
  float kernel2DSize;
  float maxScreenSpaceSplatSize;
  uint sortedOffset;
  float exposure;
  uint toneMapping;
} splat;

out vec2 gaussianCoordinate;
out vec4 splatColor;

vec2 getSplatScreenPosition(vec3 position) {
  vec4 clipPosition = splat.modelViewProjectionMatrix * vec4(position, 1.0);
  float inverseW = abs(clipPosition.w) > 0.000001 ? 1.0 / clipPosition.w : 0.0;
  return vec2(
    (clipPosition.x * inverseW * 0.5 + 0.5) * splat.viewportSize.x,
    (0.5 - clipPosition.y * inverseW * 0.5) * splat.viewportSize.y
  );
}

mat3 getSplatRotation(vec4 quaternion) {
  float quaternionLength = length(quaternion);
  vec4 normalized = quaternionLength > 0.000001 ? quaternion / quaternionLength : vec4(1.0, 0.0, 0.0, 0.0);
  float quaternionW = normalized.x;
  float quaternionX = normalized.y;
  float quaternionY = normalized.z;
  float quaternionZ = normalized.w;
  return mat3(
    vec3(1.0 - 2.0 * (quaternionY * quaternionY + quaternionZ * quaternionZ), 2.0 * (quaternionX * quaternionY + quaternionW * quaternionZ), 2.0 * (quaternionX * quaternionZ - quaternionW * quaternionY)),
    vec3(2.0 * (quaternionX * quaternionY - quaternionW * quaternionZ), 1.0 - 2.0 * (quaternionX * quaternionX + quaternionZ * quaternionZ), 2.0 * (quaternionY * quaternionZ + quaternionW * quaternionX)),
    vec3(2.0 * (quaternionX * quaternionZ + quaternionW * quaternionY), 2.0 * (quaternionY * quaternionZ - quaternionW * quaternionX), 1.0 - 2.0 * (quaternionX * quaternionX + quaternionY * quaternionY))
  );
}

void main() {
  vec2 corner = vec2((gl_VertexID & 1) == 0 ? -1.0 : 1.0, gl_VertexID < 2 ? -1.0 : 1.0);
  vec2 center = getSplatScreenPosition(positions);
  mat3 rotationMatrix = getSplatRotation(rotations);
  vec2 delta0 = getSplatScreenPosition(positions + rotationMatrix[0] * scales.x) - center;
  vec2 delta1 = getSplatScreenPosition(positions + rotationMatrix[1] * scales.y) - center;
  vec2 delta2 = getSplatScreenPosition(positions + rotationMatrix[2] * scales.z) - center;
  float kernelVariance = splat.kernel2DSize * splat.kernel2DSize;
  float covariance00 = dot(vec3(delta0.x, delta1.x, delta2.x), vec3(delta0.x, delta1.x, delta2.x)) + kernelVariance;
  float covariance01 = dot(vec3(delta0.x, delta1.x, delta2.x), vec3(delta0.y, delta1.y, delta2.y));
  float covariance11 = dot(vec3(delta0.y, delta1.y, delta2.y), vec3(delta0.y, delta1.y, delta2.y)) + kernelVariance;
  float halfTrace = (covariance00 + covariance11) * 0.5;
  float halfDifference = (covariance00 - covariance11) * 0.5;
  float discriminant = sqrt(max(halfDifference * halfDifference + covariance01 * covariance01, 0.0));
  float firstEigenvalue = max(halfTrace + discriminant, 0.0);
  float secondEigenvalue = max(halfTrace - discriminant, 0.0);
  vec2 firstDirection = vec2(covariance01, firstEigenvalue - covariance00);
  if (length(firstDirection) <= 0.000001) {
    firstDirection = vec2(firstEigenvalue - covariance11, covariance01);
  }
  if (length(firstDirection) <= 0.000001) {
    firstDirection = vec2(1.0, 0.0);
  }
  firstDirection = normalize(firstDirection);
  vec2 secondDirection = vec2(-firstDirection.y, firstDirection.x);
  float firstAxisLength = max(sqrt(firstEigenvalue), 0.001);
  float secondAxisLength = max(sqrt(secondEigenvalue), 0.001);
  float maximumAxisLength = max(firstAxisLength, secondAxisLength);
  float clampScale = min(max(splat.maxScreenSpaceSplatSize, 0.001) / maximumAxisLength, 1.0);
  float supportScale = splat.gaussianSupportRadius * splat.radiusScale * clampScale;
  vec2 screenOffset = (corner.x * firstDirection * firstAxisLength + corner.y * secondDirection * secondAxisLength) * supportScale;
  vec4 clipCenter = splat.modelViewProjectionMatrix * vec4(positions, 1.0);
  vec2 clipOffset = vec2(screenOffset.x * 2.0 / max(splat.viewportSize.x, 1.0), -screenOffset.y * 2.0 / max(splat.viewportSize.y, 1.0)) * clipCenter.w;
  gl_Position = vec4(clipCenter.xy + clipOffset, clipCenter.z, clipCenter.w);
  gaussianCoordinate = corner * splat.gaussianSupportRadius;
  float visible = maximumAxisLength * splat.radiusScale >= splat.screenSizeCutoffPixels ? 1.0 : 0.0;
  splatColor = vec4(colors.rgb, colors.a * opacities * splat.alphaScale * visible);
}
`;

/** WebGL2 Gaussian fragment shader using the same opacity controls as WebGPU. */
export const SPLAT_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform splatUniforms {
  mat4 modelViewProjectionMatrix;
  vec2 viewportSize;
  float radiusScale;
  float alphaScale;
  float alphaCutoff;
  float screenSizeCutoffPixels;
  float gaussianSupportRadius;
  float kernel2DSize;
  float maxScreenSpaceSplatSize;
  uint sortedOffset;
  float exposure;
  uint toneMapping;
} splat;

in vec2 gaussianCoordinate;
in vec4 splatColor;
out vec4 fragmentColor;

void main() {
  float gaussianWeight = exp(-0.5 * dot(gaussianCoordinate, gaussianCoordinate));
  float alpha = splatColor.a * gaussianWeight;
  if (alpha < splat.alphaCutoff) {
    discard;
  }
  vec3 linearColor = max(splatColor.rgb * splat.exposure, vec3(0.0));
  vec3 mappedColor = splat.toneMapping == 1u
    ? linearColor / (vec3(1.0) + linearColor)
    : linearColor;
  fragmentColor = vec4(mappedColor, alpha);
}
`;
