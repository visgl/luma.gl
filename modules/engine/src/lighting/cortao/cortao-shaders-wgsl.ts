// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// The CORTAO functions in this file are adapted from src/shaders/*.h of the CORTAO reference
// implementation (https://github.com/theagentd/CORTAO).
// SPDX-FileCopyrightText: Copyright (c) 2026 Daniel Isheden
// See THIRD-PARTY-NOTICES.md in this module.

import {CORTAO_PACKED_NORMAL_BITS} from './cortao-shaders';

/**
 * The WGSL passes of CORTAO for WebGPU.
 *
 * All passes are compute passes with 8 x 8 workgroups. The prepass, the
 * mip pass and the main pass work in "GL pixel coordinates", with the origin at the bottom left,
 * as in the GLSL port. They flip the row only when they read or write a texel. So the noise,
 * the mip child choice and the sample positions are the same as in the GLSL port. The filter pass
 * works in texel coordinates, as the reference does: its math does not depend on the direction
 * of the rows.
 */

/** The workgroup size of the compute passes, in both dimensions. */
export const CORTAO_WORKGROUP_SIZE = 8;

/** Shared WGSL code of the compute passes. */
const CORTAO_BASE_WGSL = /* wgsl */ `\
const CORTAO_PI2: f32 = 6.283185307179586;
const CORTAO_GOLDEN_ANGLE: f32 = 2.3999632297286535;
const CORTAO_PACKED_NORMAL_BITS: u32 = ${CORTAO_PACKED_NORMAL_BITS}u;

fn cortao_seed(coords: vec2u) -> u32 {
  // 1719413 * 929 and 140473 * 2467 * 11.
  let q = coords * vec2u(1597334677u, 3812015801u);
  return q.x ^ q.y;
}

fn cortao_hash(n: u32) -> u32 {
  return n * (n ^ (n >> 15u));
}

fn cortao_hash2(n: vec2u) -> vec2u {
  return n * (n ^ (n >> vec2u(15u)));
}

fn cortao_unpack16(x: u32) -> vec2u {
  return vec2u(x & 0xFFFFu, x >> 16u);
}

fn cortao_encodeNormal(normal: vec3f, dither: vec2f) -> u32 {
  let bitsPerComponent = CORTAO_PACKED_NORMAL_BITS / 2u;
  let componentMask = (1u << bitsPerComponent) - 1u;
  let componentMax = componentMask >> 1u;
  let encodedNormal = normal.xy * inverseSqrt(normal.z * 2.0 + 2.0);
  let values = vec2i(floor(encodedNormal * f32(componentMax) + dither));
  return (bitcast<u32>(values.x) & componentMask) |
    ((bitcast<u32>(values.y) & componentMask) << bitsPerComponent);
}

fn cortao_decodeNormal(packedData: u32) -> vec3f {
  let bitsPerComponent = CORTAO_PACKED_NORMAL_BITS / 2u;
  let componentMax = i32(((1u << bitsPerComponent) - 1u) >> 1u);
  let leftShift = vec2u(32u - bitsPerComponent, 32u - bitsPerComponent * 2u);
  let values = (vec2i(bitcast<i32>(packedData)) << leftShift) >> vec2u(32u - bitsPerComponent);
  let e = vec2f(values) * (1.0 / f32(componentMax));
  let z = max(1.0 - e.x * e.x - e.y * e.y, 0.0);
  return vec3f(e * (2.0 * sqrt(z)), z * 2.0 - 1.0);
}

fn cortao_unpackDepth(packedData: u32) -> f32 {
  return bitcast<f32>(packedData);
}

fn cortao_unprojectWithOffset(
  unprojectParameters: vec4f, texCoords: vec2f, linearDepth: f32, offset: vec3f
) -> vec3f {
  let direction = texCoords * unprojectParameters.xy + unprojectParameters.zw;
  return vec3f(direction, -1.0) * linearDepth + offset;
}

fn cortao_unproject(unprojectParameters: vec4f, texCoords: vec2f, linearDepth: f32) -> vec3f {
  return cortao_unprojectWithOffset(unprojectParameters, texCoords, linearDepth, vec3f(0.0));
}

// Converts between GL pixel coordinates (origin at the bottom left) and texel coordinates.
fn cortao_flipRow(coords: vec2i, size: vec2i) -> vec2i {
  return vec2i(coords.x, size.y - 1 - coords.y);
}
`;

/**
 * Prepass. Port of `cortao_prepass()` for level 0 only, with normals from depth, as in the GLSL
 * port. Bindings: 0 uniforms, 1 hardware depth, 2 packed level 0 (storage), 3 normal (storage).
 */
export function getCORTAOPrepassWGSL(scaled: boolean): string {
  return /* wgsl */ `\
${CORTAO_BASE_WGSL}
struct CORTAOPrepassUniforms {
  unprojectParams: vec4f,
  resolution: vec2f,
  depthScale: f32,
  depthOffset: f32,
  randomSeed: u32,
};

@group(0) @binding(0) var<uniform> cortaoPrepass: CORTAOPrepassUniforms;
@group(0) @binding(1) var depthTexture: texture_depth_2d;
@group(0) @binding(2) var packedOutput: texture_storage_2d<r32uint, write>;
@group(0) @binding(3) var normalOutput: texture_storage_2d<rgba8unorm, write>;

struct CORTAOPosition {
  valid: bool,
  position: vec3f,
};

fn cortao_skyDepth() -> f32 {
  // Handles both standard and reverse depth.
  return select(0.0, 1.0, cortaoPrepass.depthScale < 0.0);
}

fn cortao_loadPosition(pixel: vec2i) -> CORTAOPosition {
  let size = vec2i(cortaoPrepass.resolution);
  if (any(pixel < vec2i(0)) || any(pixel >= size)) {
    return CORTAOPosition(false, vec3f(0.0));
  }
  ${
    scaled
      ? `let depthSize = vec2i(textureDimensions(depthTexture));
  let sampleScale = vec2f(depthSize) / vec2f(size);
  let depthPixel = vec2i((vec2f(cortao_flipRow(pixel, size)) + 0.5) * sampleScale);
  let texCoords = (vec2f(cortao_flipRow(depthPixel, depthSize)) + 0.5) / vec2f(depthSize);`
      : `let depthPixel = cortao_flipRow(pixel, size);
  let texCoords = (vec2f(pixel) + 0.5) / cortaoPrepass.resolution;`
  }
  let depth = textureLoad(depthTexture, depthPixel, 0);
  if (depth == cortao_skyDepth()) {
    return CORTAOPosition(false, vec3f(0.0));
  }
  let linearDepth = 1.0 / (depth * cortaoPrepass.depthScale + cortaoPrepass.depthOffset);
  return CORTAOPosition(true, cortao_unproject(cortaoPrepass.unprojectParams, texCoords, linearDepth));
}

// Picks the neighbor difference along one axis with the smaller depth step. This keeps the
// normal of a surface intact at the silhouette of a nearer or farther surface.
fn cortao_getTangent(pixel: vec2i, axis: vec2i, position: vec3f) -> CORTAOPosition {
  let forwardSample = cortao_loadPosition(pixel + axis);
  let backwardSample = cortao_loadPosition(pixel - axis);
  let forward = forwardSample.position - position;
  let backward = position - backwardSample.position;
  if (forwardSample.valid && backwardSample.valid) {
    return CORTAOPosition(true, select(backward, forward, abs(forward.z) < abs(backward.z)));
  }
  if (forwardSample.valid) {
    return CORTAOPosition(true, forward);
  }
  if (backwardSample.valid) {
    return CORTAOPosition(true, backward);
  }
  return CORTAOPosition(false, vec3f(0.0));
}

@compute @workgroup_size(${CORTAO_WORKGROUP_SIZE}, ${CORTAO_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2i(cortaoPrepass.resolution);
  let texel = vec2i(id.xy);
  if (any(texel >= size)) {
    return;
  }
  let pixel = cortao_flipRow(texel, size);
  let center = cortao_loadPosition(pixel);
  if (!center.valid) {
    textureStore(packedOutput, texel, vec4u(0u));
    textureStore(normalOutput, texel, vec4f(0.5, 0.5, 1.0, 1.0));
    return;
  }
  let position = center.position;
  let linearDepth = -position.z;

  var normal = normalize(-position);
  let tangentX = cortao_getTangent(pixel, vec2i(1, 0), position);
  let tangentY = cortao_getTangent(pixel, vec2i(0, 1), position);
  if (tangentX.valid && tangentY.valid) {
    let crossProduct = cross(tangentX.position, tangentY.position);
    if (dot(crossProduct, crossProduct) > 0.0) {
      normal = normalize(crossProduct);
    }
  }
  // A visible surface faces the camera.
  if (dot(normal, position) > 0.0) {
    normal = -normal;
  }

  // Pack a sphere-map encoded normal into the low bits of the linear depth.
  let seed = cortao_hash(cortao_seed(vec2u(pixel)) + cortaoPrepass.randomSeed);
  let dither = vec2f(cortao_unpack16(seed)) * (1.0 / 65535.0);
  let mask = (1u << CORTAO_PACKED_NORMAL_BITS) - 1u;
  let packedNormal = cortao_encodeNormal(normal, dither);
  let packedData = (bitcast<u32>(linearDepth) & ~mask) | (packedNormal & mask);
  textureStore(packedOutput, texel, vec4u(packedData, 0u, 0u, 0u));
  textureStore(normalOutput, texel, vec4f(normal * 0.5 + 0.5, 1.0));
}
`;
}

/**
 * Mip pass for one level. Port of the mip chain part of `cortao_prepass()`. CORTAO does not average
 * depth: each texel of level K copies one of its four children in level K - 1, chosen by the
 * random seed. Bindings: 0 uniforms, 1 level K - 1, 2 level K (storage).
 */
export const CORTAO_MIPMAP_WGSL = /* wgsl */ `\
struct CORTAOMipmapUniforms {
  resolution: vec2f,
  level: u32,
  randomSeed: u32,
};

@group(0) @binding(0) var<uniform> cortaoMipmap: CORTAOMipmapUniforms;
@group(0) @binding(1) var sourceLevel: texture_2d<u32>;
@group(0) @binding(2) var targetLevel: texture_storage_2d<r32uint, write>;

@compute @workgroup_size(${CORTAO_WORKGROUP_SIZE}, ${CORTAO_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2u(cortaoMipmap.resolution);
  let level = cortaoMipmap.level;
  let levelSize = max(size >> vec2u(level), vec2u(1u));
  if (any(id.xy >= levelSize)) {
    return;
  }
  let sourceSize = max(size >> vec2u(level - 1u), vec2u(1u));
  // GL pixel coordinates of this texel.
  let coords = vec2u(id.x, levelSize.y - 1u - id.y);
  // The child that cortao_prepass() does not reject as "wrongPixel" at this level.
  let dither = vec2u(cortaoMipmap.randomSeed) >> vec2u(level * 2u, level * 2u + 1u);
  var child = coords * 2u + vec2u((coords.y ^ dither.x) & 1u, (coords.x ^ dither.y) & 1u);
  child = min(child, sourceSize - 1u);
  let sourceTexel = vec2u(child.x, sourceSize.y - 1u - child.y);
  textureStore(targetLevel, id.xy, vec4u(textureLoad(sourceLevel, sourceTexel, 0).r, 0u, 0u, 0u));
}
`;

/** The defines of the main pass. */
export type CORTAOMainPassWGSLOptions = {
  sampleCount: number;
  rayCount: number;
  lookupDirectionResolution: number;
  lookupRadiusResolution: number;
};

/**
 * Main pass. Port of `cortao_mainPass()` for a perspective projection, with the occluder lookup
 * table and occlusion output only. It reads real mip levels with `textureLoad()`. Bindings:
 * 0 uniforms, 1 packed data with all levels, 2 normal, 3 lookup table, 4 occlusion (storage).
 */
export function getCORTAOMainPassWGSL(options: CORTAOMainPassWGSLOptions): string {
  return /* wgsl */ `\
${CORTAO_BASE_WGSL}
const CORTAO_SAMPLE_COUNT: i32 = ${options.sampleCount};
const CORTAO_RAY_COUNT: u32 = ${options.rayCount}u;
const CORTAO_LOOKUP_SIZE = vec3i(
  ${options.lookupDirectionResolution}, ${options.lookupDirectionResolution}, ${options.lookupRadiusResolution}
);

struct CORTAOMainUniforms {
  unprojectParams: vec4f,
  projectionParams: vec4f,
  resolution: vec2f,
  normalBias: f32,
  radius: f32,
  maxApparentCircleRadiusCoefficient: f32,
  mipBias: f32,
  inverseMaxSlopeCompensation: f32,
  backfaceThreshold: f32,
  backfaceBoost: f32,
  intensity: f32,
  mipCount: i32,
  randomSeed: u32,
};

@group(0) @binding(0) var<uniform> cortaoMain: CORTAOMainUniforms;
@group(0) @binding(1) var packedDataTexture: texture_2d<u32>;
@group(0) @binding(2) var normalTexture: texture_2d<f32>;
@group(0) @binding(3) var occluderLookupTable: texture_3d<u32>;
@group(0) @binding(4) var occlusionOutput: texture_storage_2d<rgba8unorm, write>;

// Nearest-mip sample of the packed data with a border value of 0.
fn cortao_samplePackedData(texCoords: vec2f, mipmap: f32) -> u32 {
  if (any(texCoords < vec2f(0.0)) || any(texCoords >= vec2f(1.0))) {
    return 0u;
  }
  let level = clamp(i32(floor(mipmap + 0.5)), 0, cortaoMain.mipCount - 1);
  let size = vec2i(cortaoMain.resolution);
  let levelSize = max(size >> vec2u(u32(level)), vec2i(1));
  let texel = min(vec2i(texCoords * vec2f(levelSize)), levelSize - 1);
  return textureLoad(packedDataTexture, cortao_flipRow(texel, levelSize), level).r;
}

// Nearest sample with clamp-to-edge.
fn cortao_sampleOccluderLookupTable(texCoords: vec3f) -> u32 {
  let texel = clamp(vec3i(floor(texCoords * vec3f(CORTAO_LOOKUP_SIZE))), vec3i(0), CORTAO_LOOKUP_SIZE - 1);
  return textureLoad(occluderLookupTable, texel, 0).r;
}

fn cortao_computeRayOcclusion(
  offsetDither: f32,
  offsetTransform: mat3x3f,
  tangentSpaceTransform: mat3x3f,
  mipBias: f32,
  viewPosition: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  maxRadius: f32
) -> u32 {
  var rayBits = 0u;
  for (var i = 0; i < CORTAO_SAMPLE_COUNT; i++) {
    // Golden-angle spiral direction.
    let a = f32(i) * CORTAO_GOLDEN_ANGLE;
    let spiral = vec2f(cos(a), sin(a));
    let inverseSampleCount = 1.0 / f32(CORTAO_SAMPLE_COUNT);

    // The skew pulls the sample distribution toward the center.
    let skew = 3.5;
    let innerRadius = pow(f32(i) * inverseSampleCount, skew * 0.5);
    let outerRadius = pow((f32(i) + 1.0) * inverseSampleCount, skew * 0.5);
    let innerSpiral = spiral * innerRadius;
    let outerSpiral = spiral * outerRadius;

    // The weight is the square root of the area of the strip that the sample can move over.
    let sampleArea = outerRadius * outerRadius - innerRadius * innerRadius;
    let sampleWeight = sqrt(sampleArea);
    let sampleMipmap = log2(outerRadius);

    let sampleOffset = (outerSpiral - innerSpiral) * offsetDither + innerSpiral;
    let projectedCoords = offsetTransform * vec3f(sampleOffset, 1.0);
    let sampleCoords = projectedCoords.xy / projectedCoords.z;

    let mipmap = mipBias + sampleMipmap;
    let packedData = cortao_samplePackedData(sampleCoords, mipmap);
    let sampleDepth = cortao_unpackDepth(packedData);

    let dPos = cortao_unprojectWithOffset(cortaoMain.unprojectParams, sampleCoords, sampleDepth, -viewPosition);

    // Sky samples and samples outside the screen have a depth of 0, which is outside the hemisphere.
    let lengthSquared = dot(dPos, dPos);
    if (lengthSquared < maxRadius * maxRadius && dot(dPos, normal) > 0.0) {
      let inverseLength = inverseSqrt(lengthSquared);
      var direction = dPos * inverseLength;
      let sampleNormal = cortao_decodeNormal(packedData);

      let slopeCompensation = inverseSqrt(max(dot(sampleNormal, viewDirection), cortaoMain.inverseMaxSlopeCompensation));
      var occluderRadius = (maxRadius * sampleWeight) * (slopeCompensation * inverseLength);

      let sampleDot = dot(sampleNormal, direction);
      if (sampleDot < cortaoMain.backfaceThreshold) {
        // Front face: move the occluder by one radius into the object to prevent self-occlusion.
        let adjustedOffset = -occluderRadius / max(1.0 - occluderRadius * occluderRadius * 0.5, 0.000001);
        direction = normalize(sampleNormal * adjustedOffset + direction);
      } else {
        // Back face: optionally enlarge the occluder to prevent light leaks.
        occluderRadius *= mix(1.0, slopeCompensation, cortaoMain.backfaceBoost);
      }

      let hemisphereDirection = direction * tangentSpaceTransform;

      // Sphere-map encode the direction to get the lookup coordinates.
      let scale = inverseSqrt(hemisphereDirection.z * 8.0 + 8.0);
      let sphereMapCoordinates = hemisphereDirection.xy * scale + 0.5;
      let lookupCoords = vec3f(sphereMapCoordinates, occluderRadius * sqrt(0.5));
      // The sphere-map projection fails for (0, 0, -1). Ignore that sample.
      if (hemisphereDirection.z > -0.99) {
        rayBits |= cortao_sampleOccluderLookupTable(lookupCoords);
      }
    }
  }
  return rayBits;
}

// Frisvad's orthonormal basis. Returns the tangent and the bitangent as the columns 0 and 1.
fn cortao_constructBasis(normal: vec3f) -> mat2x3f {
  let a = 1.0 / max(1.0 + normal.z, 0.000001);
  let b = normal.x * normal.y * a;
  return mat2x3f(
    vec3f(normal.x * normal.x * a - 1.0, b, normal.x),
    vec3f(b, normal.y * normal.y * a - 1.0, normal.y)
  );
}

@compute @workgroup_size(${CORTAO_WORKGROUP_SIZE}, ${CORTAO_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2i(cortaoMain.resolution);
  let texel = vec2i(id.xy);
  if (any(texel >= size)) {
    return;
  }
  let pixelCoords = cortao_flipRow(texel, size);
  let texCoords = (vec2f(pixelCoords) + 0.5) / cortaoMain.resolution;

  let linearDepth = cortao_unpackDepth(textureLoad(packedDataTexture, texel, 0).r);
  if (linearDepth == 0.0) {
    // Sky pixel.
    textureStore(occlusionOutput, texel, vec4f(1.0));
    return;
  }

  let normal = normalize(textureLoad(normalTexture, texel, 0).xyz * 2.0 - 1.0);
  var viewPosition = cortao_unproject(cortaoMain.unprojectParams, texCoords, linearDepth);

  let random = cortao_hash2(vec2u(cortao_seed(vec2u(pixelCoords))) + cortao_unpack16(cortaoMain.randomSeed));
  let randomSampleRotation = f32(random.x) * (CORTAO_PI2 / 4294967295.0);
  let offsetDither = f32(random.y) * (1.0 / 4294967295.0);
  let randomTangentRotation = f32(random.x ^ random.y ^ cortaoMain.randomSeed) * (CORTAO_PI2 / 4294967295.0);
  let sampleRotation = vec2f(sin(randomSampleRotation), cos(randomSampleRotation));

  // The radius is the world-space radius, clamped by the maximum screen-space radius.
  let clampedRadius = min(cortaoMain.radius, linearDepth * cortaoMain.maxApparentCircleRadiusCoefficient);

  // Near the sampling sphere, the sphere looks larger due to the horizon. Expand the circle.
  let inverseCircleDistance = inverseSqrt(linearDepth * linearDepth - clampedRadius * clampedRadius);
  let apparentCircleRadius = clampedRadius * inverseCircleDistance;
  let circleRadius = apparentCircleRadius * linearDepth;

  let viewDirection = -normalize(viewPosition);

  // The sample pattern stretches near the screen edge. Increase the mip bias to compensate.
  let stretchMultiplier = inverseSqrt(viewDirection.z);
  let baseMipBias = log2(apparentCircleRadius * stretchMultiplier) + cortaoMain.mipBias;

  // Push the center out along the normal to prevent self-shadowing.
  let pixelSize = cortaoMain.normalBias * linearDepth;
  viewPosition = normal * pixelSize + viewPosition;

  let scaledRotation = sampleRotation * circleRadius;
  let rotationScaleMatrix = mat3x3f(
    scaledRotation.x, -scaledRotation.y, 0.0,
    scaledRotation.y, scaledRotation.x, 0.0,
    0.0, 0.0, 1.0
  );

  let viewBasis = cortao_constructBasis(viewDirection);
  var right = viewBasis[0];
  let up = viewBasis[1];
  // Randomly switch between a clockwise and a counter-clockwise spiral.
  if ((random.x & 1u) == 0u) {
    right = -right;
  }
  let circleMatrix = mat3x3f(right, up, viewPosition);

  // Truncated projection: field of view and off-center offset, with the NDC to texture transform.
  let projectionMatrix = mat3x3f(
    cortaoMain.projectionParams.x, 0.0, 0.0,
    0.0, cortaoMain.projectionParams.y, 0.0,
    cortaoMain.projectionParams.z, cortaoMain.projectionParams.w, -1.0
  );
  let offsetTransform = projectionMatrix * (circleMatrix * rotationScaleMatrix);

  let normalBasis = cortao_constructBasis(normal);
  let s = sin(randomTangentRotation);
  let c = cos(randomTangentRotation);
  let tangent = c * normalBasis[0] + s * normalBasis[1];
  let bitangent = c * normalBasis[1] - s * normalBasis[0];
  let tangentSpaceTransform = mat3x3f(tangent, bitangent, normal);

  let rayBits = cortao_computeRayOcclusion(
    offsetDither, offsetTransform, tangentSpaceTransform, baseMipBias, viewPosition, normal, viewDirection, clampedRadius
  );

  var occlusion = 1.0 - f32(countOneBits(rayBits)) / f32(CORTAO_RAY_COUNT);
  // Non-photorealistic intensity, as the CORTAO documentation recommends.
  occlusion = pow(occlusion, cortaoMain.intensity);
  textureStore(occlusionOutput, texel, vec4f(occlusion, 0.0, 0.0, 1.0));
}
`;
}

/** The defines of the filter pass. */
export type CORTAOFilterPassWGSLOptions = {
  largeFilter: boolean;
  filterSymmetry: boolean;
};

/**
 * Filter pass. Port of `cortao_filterPass()` for occlusion only, with `textureGather()`. Each
 * invocation filters one 2 x 2 block, as in the reference. WebGPU has no border clamp, so the
 * gathers zero the texels outside the texture. Bindings: 0 uniforms, 1 packed level 0,
 * 2 occlusion, 3 nearest non-filtering sampler, 4 filtered occlusion (storage).
 */
export function getCORTAOFilterPassWGSL(options: CORTAOFilterPassWGSLOptions): string {
  const offsets = options.largeFilter
    ? [
        [3, 0],
        [6, 0],
        [3, 3],
        [0, 3],
        [0, 6],
        [3, -3]
      ]
    : [
        [3, 0],
        [0, 3]
      ];
  const taps = offsets
    .map(([x, y]) => {
      const minimum = options.filterSymmetry
        ? `
    let minWeight = min(weightA, weightB);
    weightA = minWeight;
    weightB = minWeight;`
        : '';
      return `
  {
    let offset = vec2i(${x}, ${y});
    var weightA = cortao_calculateWeight(weightParams, cortao_gatherPackedData(pixelCoords - offset), -offset);
    var weightB = cortao_calculateWeight(weightParams, cortao_gatherPackedData(pixelCoords + offset), offset);${minimum}
    weightSum += weightA + weightB;
    occlusionSum += cortao_gatherOcclusion(pixelCoords - offset) * weightA;
    occlusionSum += cortao_gatherOcclusion(pixelCoords + offset) * weightB;
  }`;
    })
    .join('');
  return /* wgsl */ `\
const CORTAO_PACKED_NORMAL_BITS: u32 = ${CORTAO_PACKED_NORMAL_BITS}u;

struct CORTAOFilterUniforms {
  resolution: vec2f,
  depthSensitivity: f32,
  normalSensitivity: f32,
};

@group(0) @binding(0) var<uniform> cortaoFilter: CORTAOFilterUniforms;
@group(0) @binding(1) var packedDataTexture: texture_2d<u32>;
@group(0) @binding(2) var occlusionTexture: texture_2d<f32>;
@group(0) @binding(3) var pointSampler: sampler;
@group(0) @binding(4) var occlusionOutput: texture_storage_2d<rgba8unorm, write>;

struct CORTAOWeightParams {
  depthMultiplier: vec4f,
  depthOffset: f32,
  deltaX: vec4f,
  deltaY: vec4f,
  centerNormalX: vec4i,
  centerNormalY: vec4i,
  normalErrorMultiplier: f32,
};

// A gather at the texel corner "corner" reads the texels corner - 1 and corner on each axis.
// Component order: x = (x0, y1), y = (x1, y1), z = (x1, y0), w = (x0, y0).
fn cortao_gatherMask(corner: vec2i) -> vec4<bool> {
  let size = vec2i(cortaoFilter.resolution);
  let low = corner - vec2i(1);
  let x0 = low.x >= 0 && low.x < size.x;
  let x1 = corner.x >= 0 && corner.x < size.x;
  let y0 = low.y >= 0 && low.y < size.y;
  let y1 = corner.y >= 0 && corner.y < size.y;
  return vec4<bool>(x0 && y1, x1 && y1, x1 && y0, x0 && y0);
}

fn cortao_gatherPackedData(corner: vec2i) -> vec4u {
  let texCoords = vec2f(corner) / cortaoFilter.resolution;
  return select(vec4u(0u), textureGather(0, packedDataTexture, pointSampler, texCoords), cortao_gatherMask(corner));
}

fn cortao_gatherOcclusion(corner: vec2i) -> vec4f {
  let texCoords = vec2f(corner) / cortaoFilter.resolution;
  return select(vec4f(0.0), textureGather(0, occlusionTexture, pointSampler, texCoords), cortao_gatherMask(corner));
}

fn cortao_unpackDepth(packedData: vec4u) -> vec4f {
  return bitcast<vec4f>(packedData);
}

fn cortao_unpackNormalX(packedData: vec4u) -> vec4i {
  let normalBits = CORTAO_PACKED_NORMAL_BITS / 2u;
  return (bitcast<vec4i>(packedData) << vec4u(32u - normalBits)) >> vec4u(32u - normalBits);
}

fn cortao_unpackNormalY(packedData: vec4u) -> vec4i {
  let normalBits = CORTAO_PACKED_NORMAL_BITS / 2u;
  return (bitcast<vec4i>(packedData) << vec4u(32u - normalBits * 2u)) >> vec4u(32u - normalBits);
}

fn cortao_calculateWeight(params: CORTAOWeightParams, packedData: vec4u, offset: vec2i) -> vec4f {
  let sampleDepth = cortao_unpackDepth(packedData) * params.depthMultiplier + params.depthOffset;
  var error = abs(params.deltaX * f32(offset.x) + params.deltaY * f32(offset.y) + sampleDepth);
  let normalX = cortao_unpackNormalX(packedData) - params.centerNormalX;
  let normalY = cortao_unpackNormalY(packedData) - params.centerNormalY;
  error += vec4f(normalX * normalX + normalY * normalY) * params.normalErrorMultiplier;
  return exp2(-error);
}

@compute @workgroup_size(${CORTAO_WORKGROUP_SIZE}, ${CORTAO_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let resolution = vec2i(cortaoFilter.resolution);
  let pixelCoords = vec2i(id.xy) * 2 + vec2i(1);
  // ">" is correct here, as the block also writes pixelCoords - 1.
  if (pixelCoords.x > resolution.x || pixelCoords.y > resolution.y) {
    return;
  }

  let centerPackedData = cortao_gatherPackedData(pixelCoords);
  let centerDepth = cortao_unpackDepth(centerPackedData);
  let inverseCenterDepth = 1.0 / centerDepth;
  let sensitivity = cortaoFilter.depthSensitivity;

  var weightParams: CORTAOWeightParams;
  weightParams.deltaX = (centerDepth.xxww - centerDepth.yyzz) * inverseCenterDepth * sensitivity;
  weightParams.deltaY = (centerDepth.wzzw - centerDepth.xyyx) * inverseCenterDepth * sensitivity;
  weightParams.depthMultiplier = sensitivity * inverseCenterDepth;
  weightParams.depthOffset = -sensitivity;
  weightParams.centerNormalX = cortao_unpackNormalX(centerPackedData);
  weightParams.centerNormalY = cortao_unpackNormalY(centerPackedData);
  weightParams.normalErrorMultiplier = cortaoFilter.normalSensitivity / f32(1u << (CORTAO_PACKED_NORMAL_BITS / 2u));

  var occlusionSum = cortao_gatherOcclusion(pixelCoords);
  var weightSum = vec4f(1.0);
${taps}

  let result = occlusionSum / weightSum;
  let low = pixelCoords - vec2i(1);
  var outputCoords = array<vec2i, 4>(
    vec2i(low.x, pixelCoords.y),
    pixelCoords,
    vec2i(pixelCoords.x, low.y),
    low
  );
  for (var i = 0; i < 4; i++) {
    let coords = outputCoords[i];
    if (coords.x < resolution.x && coords.y < resolution.y) {
      // Sky pixels are not occluded.
      let occlusion = select(result[i], 1.0, centerPackedData[i] == 0u);
      textureStore(occlusionOutput, coords, vec4f(occlusion, 0.0, 0.0, 1.0));
    }
  }
}
`;
}
