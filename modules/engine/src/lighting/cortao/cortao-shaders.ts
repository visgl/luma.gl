// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// The CORTAO functions in this file are adapted from src/shaders/*.h of the CORTAO reference
// implementation (https://github.com/theagentd/CORTAO).
// SPDX-FileCopyrightText: Copyright (c) 2026 Daniel Isheden
// See THIRD-PARTY-NOTICES.md in this module.

import type {ShaderModule} from '@luma.gl/shaders';
import type {
  CORTAOFilterPassUniforms,
  CORTAOMainPassUniforms,
  CORTAOMipmapUniforms,
  CORTAOPrepassUniforms
} from './cortao-parameters';

/**
 * Number of bits of the packed data that hold the sphere-map encoded normal. The other bits hold
 * the linear depth. CORTAO's default is 10.
 */
export const CORTAO_PACKED_NORMAL_BITS = 10;

/**
 * Shared GLSL ES 3.00 code of all CORTAO passes.
 *
 * WebGL 2 has no `bitCount()`, `fma()` or `textureGather()`, and no border clamp. This port uses
 * plain arithmetic for `fma()`, a bit-twiddling `bitCount()`, and `texelFetch()` with an explicit
 * bounds test that returns the border value 0.
 */
export const cortaoBase = {
  name: 'cortaoBase',
  fs: /* glsl */ `\
precision highp int;
precision highp usampler2D;
precision highp usampler3D;
precision highp sampler2D;

#define CORTAO_PACKED_NORMAL_BITS ${CORTAO_PACKED_NORMAL_BITS}

const float CORTAO_PI2 = 6.283185307179586;
const float CORTAO_GOLDEN_ANGLE = 2.3999632297286535;

uint cortao_seed(uvec2 coords) {
  // 1719413 * 929 and 140473 * 2467 * 11.
  uvec2 q = coords * uvec2(1597334677u, 3812015801u);
  return q.x ^ q.y;
}

uint cortao_hash(uint n) {
  return n * (n ^ (n >> 15u));
}

uvec2 cortao_hash(uvec2 n) {
  return n * (n ^ (n >> 15u));
}

uvec2 cortao_unpack16(uint x) {
  return uvec2(x & 0xFFFFu, x >> 16u);
}

uint cortao_bitCount(uint value) {
  value = value - ((value >> 1u) & 0x55555555u);
  value = (value & 0x33333333u) + ((value >> 2u) & 0x33333333u);
  return (((value + (value >> 4u)) & 0x0F0F0F0Fu) * 0x01010101u) >> 24u;
}

uint cortao_encodeNormal(vec3 normal, vec2 dither) {
  uint bitsPerComponent = uint(CORTAO_PACKED_NORMAL_BITS / 2);
  uint componentMask = (1u << bitsPerComponent) - 1u;
  uint componentMax = componentMask >> 1u;
  vec2 encodedNormal = normal.xy * inversesqrt(normal.z * 2.0 + 2.0);
  ivec2 values = ivec2(floor(encodedNormal * float(componentMax) + dither));
  return (uint(values.x) & componentMask) | ((uint(values.y) & componentMask) << bitsPerComponent);
}

vec3 cortao_decodeNormal(uint packedData) {
  int bitsPerComponent = CORTAO_PACKED_NORMAL_BITS / 2;
  int componentMax = ((1 << bitsPerComponent) - 1) >> 1;
  ivec2 leftShift = ivec2(32 - bitsPerComponent, 32 - bitsPerComponent * 2);
  ivec2 values = (ivec2(int(packedData)) << leftShift) >> ivec2(32 - bitsPerComponent);
  vec2 e = vec2(values) * (1.0 / float(componentMax));
  float z = max(1.0 - e.x * e.x - e.y * e.y, 0.0);
  return vec3(e * (2.0 * sqrt(z)), z * 2.0 - 1.0);
}

float cortao_unpackDepth(uint packedData) {
  return uintBitsToFloat(packedData);
}

vec3 cortao_unprojectWithOffset(vec4 unprojectParameters, vec2 texCoords, float linearDepth, vec3 offset) {
  vec2 direction = texCoords * unprojectParameters.xy + unprojectParameters.zw;
  return vec3(direction, -1.0) * linearDepth + offset;
}

vec3 cortao_unproject(vec4 unprojectParameters, vec2 texCoords, float linearDepth) {
  return cortao_unprojectWithOffset(unprojectParameters, texCoords, linearDepth, vec3(0.0));
}
`
} as const satisfies ShaderModule;

/** Uniform block of the prepass. */
export const cortaoPrepass = {
  name: 'cortaoPrepass',
  dependencies: [cortaoBase],
  fs: /* glsl */ `\
layout(std140) uniform cortaoPrepassUniforms {
  vec4 unprojectParams;
  vec2 resolution;
  float depthScale;
  float depthOffset;
  uint randomSeed;
} cortaoPrepass;
`,
  uniformTypes: {
    unprojectParams: 'vec4<f32>',
    resolution: 'vec2<f32>',
    depthScale: 'f32',
    depthOffset: 'f32',
    randomSeed: 'u32'
  }
} as const satisfies ShaderModule<CORTAOPrepassUniforms>;

/**
 * Prepass fragment shader. Port of `cortao_prepass()` for level 0 only.
 *
 * It linearizes the hardware depth and packs it with a low-precision normal into one R32UI
 * texel. Deck.gl has no normal buffer, so this pass reconstructs the view-space normal from the
 * depth of the neighbor pixels. It also writes the full-precision normal for the main pass.
 */
export const CORTAO_PREPASS_FS = /* glsl */ `\
#version 300 es
uniform highp sampler2D depthTexture;

layout(location = 0) out uvec4 packedOutput;
layout(location = 1) out vec4 normalOutput;

float cortao_skyDepth() {
  // Handles both standard and reverse depth.
  return cortaoPrepass.depthScale < 0.0 ? 1.0 : 0.0;
}

bool cortao_loadPosition(ivec2 pixel, out vec3 position) {
  ivec2 size = ivec2(cortaoPrepass.resolution);
  if (any(lessThan(pixel, ivec2(0))) || any(greaterThanEqual(pixel, size))) {
    return false;
  }
#if CORTAO_SCALED_DEPTH
  ivec2 depthSize = textureSize(depthTexture, 0);
  ivec2 depthPixel = ivec2((vec2(pixel) + 0.5) * (vec2(depthSize) / vec2(size)));
#else
  ivec2 depthSize = size;
  ivec2 depthPixel = pixel;
#endif
  float depth = texelFetch(depthTexture, depthPixel, 0).r;
  if (depth == cortao_skyDepth()) {
    return false;
  }
  float linearDepth = 1.0 / (depth * cortaoPrepass.depthScale + cortaoPrepass.depthOffset);
  vec2 texCoords = (vec2(depthPixel) + 0.5) / vec2(depthSize);
  position = cortao_unproject(cortaoPrepass.unprojectParams, texCoords, linearDepth);
  return true;
}

// Picks the neighbor difference along one axis with the smaller depth step. This keeps the
// normal of a surface intact at the silhouette of a nearer or farther surface.
bool cortao_getTangent(ivec2 pixel, ivec2 axis, vec3 position, out vec3 tangent) {
  vec3 forwardPosition;
  vec3 backwardPosition;
  bool hasForward = cortao_loadPosition(pixel + axis, forwardPosition);
  bool hasBackward = cortao_loadPosition(pixel - axis, backwardPosition);
  vec3 forward = forwardPosition - position;
  vec3 backward = position - backwardPosition;
  if (hasForward && hasBackward) {
    tangent = abs(forward.z) < abs(backward.z) ? forward : backward;
    return true;
  }
  if (hasForward) {
    tangent = forward;
    return true;
  }
  if (hasBackward) {
    tangent = backward;
    return true;
  }
  return false;
}

void main(void) {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  vec3 position;
  if (!cortao_loadPosition(pixel, position)) {
    packedOutput = uvec4(0u);
    normalOutput = vec4(0.5, 0.5, 1.0, 1.0);
    return;
  }
  float linearDepth = -position.z;

  vec3 normal = normalize(-position);
  vec3 tangentX;
  vec3 tangentY;
  if (cortao_getTangent(pixel, ivec2(1, 0), position, tangentX) &&
      cortao_getTangent(pixel, ivec2(0, 1), position, tangentY)) {
    vec3 crossProduct = cross(tangentX, tangentY);
    if (dot(crossProduct, crossProduct) > 0.0) {
      normal = normalize(crossProduct);
    }
  }
  // A visible surface faces the camera.
  if (dot(normal, position) > 0.0) {
    normal = -normal;
  }

  // Pack a sphere-map encoded normal into the low bits of the linear depth.
  uint seed = cortao_hash(cortao_seed(uvec2(pixel)) + cortaoPrepass.randomSeed);
  vec2 dither = vec2(cortao_unpack16(seed)) * (1.0 / 65535.0);
  uint mask = (1u << uint(CORTAO_PACKED_NORMAL_BITS)) - 1u;
  uint packedNormal = cortao_encodeNormal(normal, dither);
  packedOutput = uvec4((floatBitsToUint(linearDepth) & ~mask) | (packedNormal & mask), 0u, 0u, 0u);
  normalOutput = vec4(normal * 0.5 + 0.5, 1.0);
}
`;

/** Uniform block of the mip atlas pass. */
export const cortaoMipmap = {
  name: 'cortaoMipmap',
  dependencies: [cortaoBase],
  fs: /* glsl */ `\
layout(std140) uniform cortaoMipmapUniforms {
  vec2 resolution;
  int mipCount;
  uint randomSeed;
} cortaoMipmap;
`,
  uniformTypes: {
    resolution: 'vec2<f32>',
    mipCount: 'i32',
    randomSeed: 'u32'
  }
} as const satisfies ShaderModule<CORTAOMipmapUniforms>;

/**
 * Mip atlas fragment shader. Port of the mip chain part of `cortao_prepass()`.
 *
 * CORTAO does not average depth. Each mip texel copies one of its four children, chosen by the
 * random seed. So each texel of level K is one level 0 texel. This shader walks down from level K
 * to level 0 and copies that texel. WebGL 2 cannot read and write two levels of one texture in a
 * draw, so all levels go into one atlas: level 0 at (0, 0), level K >= 1 at
 * (width, height - (height >> (K - 1))).
 */
export const CORTAO_MIPMAP_FS = /* glsl */ `\
#version 300 es
uniform highp usampler2D packedLevel0Texture;

layout(location = 0) out uvec4 packedOutput;

void main(void) {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  ivec2 size = ivec2(cortaoMipmap.resolution);
  int level = -1;
  ivec2 local = ivec2(0);
  if (pixel.x < size.x) {
    level = 0;
    local = pixel;
  } else {
    int x = pixel.x - size.x;
    for (int k = 1; k < 8; k++) {
      if (k >= cortaoMipmap.mipCount) {
        break;
      }
      ivec2 levelSize = max(size >> k, ivec2(1));
      int yOffset = size.y - (size.y >> (k - 1));
      if (x < levelSize.x && pixel.y >= yOffset && pixel.y < yOffset + levelSize.y) {
        level = k;
        local = ivec2(x, pixel.y - yOffset);
        break;
      }
    }
  }
  if (level < 0) {
    packedOutput = uvec4(0u);
    return;
  }

  uvec2 coords = uvec2(local);
  for (int k = 7; k >= 1; k--) {
    if (k > level) {
      continue;
    }
    // The child that cortao_prepass() does not reject as "wrongPixel" at this level.
    uvec2 dither = uvec2(cortaoMipmap.randomSeed) >> uvec2(uint(k * 2), uint(k * 2 + 1));
    coords = coords * 2u + uvec2((coords.y ^ dither.x) & 1u, (coords.x ^ dither.y) & 1u);
    coords = min(coords, uvec2(max(size >> (k - 1), ivec2(1)) - 1));
  }
  packedOutput = uvec4(texelFetch(packedLevel0Texture, ivec2(coords), 0).r, 0u, 0u, 0u);
}
`;

/** Uniform block of the main pass. */
export const cortaoMain = {
  name: 'cortaoMain',
  dependencies: [cortaoBase],
  fs: /* glsl */ `\
layout(std140) uniform cortaoMainUniforms {
  vec4 unprojectParams;
  vec4 projectionParams;
  vec2 resolution;
  float normalBias;
  float radius;
  float maxApparentCircleRadiusCoefficient;
  float mipBias;
  float inverseMaxSlopeCompensation;
  float backfaceThreshold;
  float backfaceBoost;
  float intensity;
  int mipCount;
  uint randomSeed;
} cortaoMain;
`,
  uniformTypes: {
    unprojectParams: 'vec4<f32>',
    projectionParams: 'vec4<f32>',
    resolution: 'vec2<f32>',
    normalBias: 'f32',
    radius: 'f32',
    maxApparentCircleRadiusCoefficient: 'f32',
    mipBias: 'f32',
    inverseMaxSlopeCompensation: 'f32',
    backfaceThreshold: 'f32',
    backfaceBoost: 'f32',
    intensity: 'f32',
    mipCount: 'i32',
    randomSeed: 'u32'
  }
} as const satisfies ShaderModule<CORTAOMainPassUniforms>;

/**
 * Main pass fragment shader. Port of `cortao_mainPass()` for a perspective projection, with the
 * occluder lookup table and occlusion output only. Needs the defines `CORTAO_SAMPLE_COUNT`,
 * `CORTAO_RAY_COUNT`, `CORTAO_LOOKUP_DIRECTION_RESOLUTION` and `CORTAO_LOOKUP_RADIUS_RESOLUTION`.
 */
export const CORTAO_MAIN_PASS_FS = /* glsl */ `\
#version 300 es
uniform highp usampler2D packedDataTexture;
uniform highp sampler2D normalTexture;
uniform highp usampler3D occluderLookupTable;

layout(location = 0) out vec4 occlusionOutput;

// Nearest-mip sample of the packed data with a border value of 0.
uint cortao_samplePackedData(vec2 texCoords, float mipmap) {
  if (any(lessThan(texCoords, vec2(0.0))) || any(greaterThanEqual(texCoords, vec2(1.0)))) {
    return 0u;
  }
  int level = clamp(int(floor(mipmap + 0.5)), 0, cortaoMain.mipCount - 1);
  ivec2 size = ivec2(cortaoMain.resolution);
  ivec2 levelSize = max(size >> level, ivec2(1));
  ivec2 texel = min(ivec2(texCoords * vec2(levelSize)), levelSize - 1);
  ivec2 offset = level == 0 ? ivec2(0) : ivec2(size.x, size.y - (size.y >> (level - 1)));
  return texelFetch(packedDataTexture, offset + texel, 0).r;
}

vec3 cortao_loadNormal(ivec2 pixelCoords) {
  return normalize(texelFetch(normalTexture, pixelCoords, 0).xyz * 2.0 - 1.0);
}

// Nearest sample with clamp-to-edge.
uint cortao_sampleOccluderLookupTable(vec3 texCoords) {
  ivec3 size = ivec3(
    CORTAO_LOOKUP_DIRECTION_RESOLUTION, CORTAO_LOOKUP_DIRECTION_RESOLUTION, CORTAO_LOOKUP_RADIUS_RESOLUTION
  );
  ivec3 texel = clamp(ivec3(floor(texCoords * vec3(size))), ivec3(0), size - 1);
  return texelFetch(occluderLookupTable, texel, 0).r;
}

uint cortao_computeRayOcclusion(
  float offsetDither,
  mat3 offsetTransform,
  mat3 tangentSpaceTransform,
  float mipBias,
  vec3 viewPosition,
  vec3 normal,
  vec3 viewDirection,
  float maxRadius
) {
  uint rayBits = 0u;
  for (int i = 0; i < CORTAO_SAMPLE_COUNT; i++) {
    // Golden-angle spiral direction.
    float a = float(i) * CORTAO_GOLDEN_ANGLE;
    vec2 spiral = vec2(cos(a), sin(a));
    float inverseSampleCount = 1.0 / float(CORTAO_SAMPLE_COUNT);

    // The skew pulls the sample distribution toward the center.
    float skew = 3.5;
    float innerRadius = pow(float(i) * inverseSampleCount, skew * 0.5);
    float outerRadius = pow((float(i) + 1.0) * inverseSampleCount, skew * 0.5);
    vec2 innerSpiral = spiral * innerRadius;
    vec2 outerSpiral = spiral * outerRadius;

    // The weight is the square root of the area of the strip that the sample can move over.
    float sampleArea = outerRadius * outerRadius - innerRadius * innerRadius;
    float sampleWeight = sqrt(sampleArea);
    float sampleMipmap = log2(outerRadius);

    vec2 sampleOffset = (outerSpiral - innerSpiral) * offsetDither + innerSpiral;
    vec3 projectedCoords = offsetTransform * vec3(sampleOffset, 1.0);
    vec2 sampleCoords = projectedCoords.xy / projectedCoords.z;

    float mipmap = mipBias + sampleMipmap;
    uint packedData = cortao_samplePackedData(sampleCoords, mipmap);
    float sampleDepth = cortao_unpackDepth(packedData);

    vec3 dPos = cortao_unprojectWithOffset(cortaoMain.unprojectParams, sampleCoords, sampleDepth, -viewPosition);

    // Sky samples and samples outside the screen have a depth of 0, which is outside the hemisphere.
    float lengthSquared = dot(dPos, dPos);
    if (lengthSquared < maxRadius * maxRadius && dot(dPos, normal) > 0.0) {
      float inverseLength = inversesqrt(lengthSquared);
      vec3 direction = dPos * inverseLength;
      vec3 sampleNormal = cortao_decodeNormal(packedData);

      float slopeCompensation = inversesqrt(max(dot(sampleNormal, viewDirection), cortaoMain.inverseMaxSlopeCompensation));
      float occluderRadius = (maxRadius * sampleWeight) * (slopeCompensation * inverseLength);

      float sampleDot = dot(sampleNormal, direction);
      if (sampleDot < cortaoMain.backfaceThreshold) {
        // Front face: move the occluder by one radius into the object to prevent self-occlusion.
        float adjustedOffset = -occluderRadius / max(1.0 - occluderRadius * occluderRadius * 0.5, 0.000001);
        direction = normalize(sampleNormal * adjustedOffset + direction);
      } else {
        // Back face: optionally enlarge the occluder to prevent light leaks.
        occluderRadius *= mix(1.0, slopeCompensation, cortaoMain.backfaceBoost);
      }

      vec3 hemisphereDirection = direction * tangentSpaceTransform;

      // Sphere-map encode the direction to get the lookup coordinates.
      float scale = inversesqrt(hemisphereDirection.z * 8.0 + 8.0);
      vec2 sphereMapCoordinates = hemisphereDirection.xy * scale + 0.5;
      vec3 lookupCoords = vec3(sphereMapCoordinates, occluderRadius * sqrt(0.5));
      // The sphere-map projection fails for (0, 0, -1). Ignore that sample.
      uint occluderRayBits = hemisphereDirection.z > -0.99 ? cortao_sampleOccluderLookupTable(lookupCoords) : 0u;
      rayBits |= occluderRayBits;
    }
  }
  return rayBits;
}

// Frisvad's orthonormal basis.
void cortao_constructBasis(vec3 normal, out vec3 tangent, out vec3 bitangent) {
  float a = 1.0 / max(1.0 + normal.z, 0.000001);
  float b = normal.x * normal.y * a;
  tangent = vec3(normal.x * normal.x * a - 1.0, b, normal.x);
  bitangent = vec3(b, normal.y * normal.y * a - 1.0, normal.y);
}

void main(void) {
  ivec2 pixelCoords = ivec2(gl_FragCoord.xy);
  vec2 texCoords = (vec2(pixelCoords) + 0.5) / cortaoMain.resolution;

  float linearDepth = cortao_unpackDepth(texelFetch(packedDataTexture, pixelCoords, 0).r);
  if (linearDepth == 0.0) {
    // Sky pixel.
    occlusionOutput = vec4(1.0);
    return;
  }

  vec3 normal = cortao_loadNormal(pixelCoords);
  vec3 viewPosition = cortao_unproject(cortaoMain.unprojectParams, texCoords, linearDepth);

  uvec2 random = cortao_hash(cortao_seed(uvec2(pixelCoords)) + cortao_unpack16(cortaoMain.randomSeed));
  float randomSampleRotation = float(random.x) * (CORTAO_PI2 / 4294967295.0);
  float offsetDither = float(random.y) * (1.0 / 4294967295.0);
  float randomTangentRotation = float(random.x ^ random.y ^ cortaoMain.randomSeed) * (CORTAO_PI2 / 4294967295.0);
  vec2 sampleRotation = vec2(sin(randomSampleRotation), cos(randomSampleRotation));

  // The radius is the world-space radius, clamped by the maximum screen-space radius.
  float clampedRadius = min(cortaoMain.radius, linearDepth * cortaoMain.maxApparentCircleRadiusCoefficient);

  // Near the sampling sphere, the sphere looks larger due to the horizon. Expand the circle.
  float inverseCircleDistance = inversesqrt(linearDepth * linearDepth - clampedRadius * clampedRadius);
  float apparentCircleRadius = clampedRadius * inverseCircleDistance;
  float circleRadius = apparentCircleRadius * linearDepth;

  vec3 viewDirection = -normalize(viewPosition);

  // The sample pattern stretches near the screen edge. Increase the mip bias to compensate.
  float stretchMultiplier = inversesqrt(viewDirection.z);
  float baseMipBias = log2(apparentCircleRadius * stretchMultiplier) + cortaoMain.mipBias;

  // Push the center out along the normal to prevent self-shadowing.
  float pixelSize = cortaoMain.normalBias * linearDepth;
  viewPosition = normal * pixelSize + viewPosition;

  vec2 scaledRotation = sampleRotation * circleRadius;
  mat3 rotationScaleMatrix = mat3(
    scaledRotation.x, -scaledRotation.y, 0.0,
    scaledRotation.y, scaledRotation.x, 0.0,
    0.0, 0.0, 1.0
  );

  vec3 right;
  vec3 up;
  cortao_constructBasis(viewDirection, right, up);
  // Randomly switch between a clockwise and a counter-clockwise spiral.
  if ((random.x & 1u) == 0u) {
    right = -right;
  }
  mat3 circleMatrix = mat3(right, up, viewPosition);

  // Truncated projection: field of view and off-center offset, with the NDC to texture transform.
  mat3 projectionMatrix = mat3(
    cortaoMain.projectionParams.x, 0.0, 0.0,
    0.0, cortaoMain.projectionParams.y, 0.0,
    cortaoMain.projectionParams.zw, -1.0
  );
  mat3 offsetTransform = projectionMatrix * (circleMatrix * rotationScaleMatrix);

  vec3 t;
  vec3 bt;
  cortao_constructBasis(normal, t, bt);
  float s = sin(randomTangentRotation);
  float c = cos(randomTangentRotation);
  vec3 tangent = c * t + s * bt;
  vec3 bitangent = c * bt - s * t;
  mat3 tangentSpaceTransform = mat3(tangent, bitangent, normal);

  uint rayBits = cortao_computeRayOcclusion(
    offsetDither, offsetTransform, tangentSpaceTransform, baseMipBias, viewPosition, normal, viewDirection, clampedRadius
  );

  float occlusion = 1.0 - float(cortao_bitCount(rayBits)) / float(CORTAO_RAY_COUNT);
  // Non-photorealistic intensity, as the CORTAO documentation recommends.
  occlusion = pow(occlusion, cortaoMain.intensity);
  occlusionOutput = vec4(occlusion, 0.0, 0.0, 1.0);
}
`;

/** Uniform block of the filter pass. */
export const cortaoFilter = {
  name: 'cortaoFilter',
  dependencies: [cortaoBase],
  fs: /* glsl */ `\
layout(std140) uniform cortaoFilterUniforms {
  vec2 resolution;
  float depthSensitivity;
  float normalSensitivity;
} cortaoFilter;
`,
  uniformTypes: {
    resolution: 'vec2<f32>',
    depthSensitivity: 'f32',
    normalSensitivity: 'f32'
  }
} as const satisfies ShaderModule<CORTAOFilterPassUniforms>;

/**
 * Filter pass fragment shader. Per-pixel port of `cortao_filterPass()` for occlusion only.
 *
 * The reference pass gathers 2x2 blocks. Component I of a gather at an offset is pixel I of the
 * block plus that offset. So each pixel reads its own taps with `texelFetch()`, and it computes
 * the depth slope from its 2x2 block as the reference does. Needs the defines
 * `CORTAO_LARGE_FILTER` and `CORTAO_FILTER_SYMMETRY`.
 */
export const CORTAO_FILTER_PASS_FS = /* glsl */ `\
#version 300 es
uniform highp usampler2D packedDataTexture;
uniform highp sampler2D occlusionTexture;

layout(location = 0) out vec4 occlusionOutput;

uint cortao_fetchPackedData(ivec2 pixel) {
  ivec2 size = ivec2(cortaoFilter.resolution);
  if (any(lessThan(pixel, ivec2(0))) || any(greaterThanEqual(pixel, size))) {
    return 0u;
  }
  return texelFetch(packedDataTexture, pixel, 0).r;
}

float cortao_fetchOcclusion(ivec2 pixel) {
  ivec2 size = ivec2(cortaoFilter.resolution);
  if (any(lessThan(pixel, ivec2(0))) || any(greaterThanEqual(pixel, size))) {
    return 0.0;
  }
  return texelFetch(occlusionTexture, pixel, 0).r;
}

int cortao_unpackNormalX(uint packedData) {
  int normalBits = CORTAO_PACKED_NORMAL_BITS / 2;
  return (int(packedData) << (32 - normalBits)) >> (32 - normalBits);
}

int cortao_unpackNormalY(uint packedData) {
  int normalBits = CORTAO_PACKED_NORMAL_BITS / 2;
  return (int(packedData) << (32 - normalBits * 2)) >> (32 - normalBits);
}

float cortao_calculateWeight(
  ivec2 pixel, ivec2 offset, float depthMultiplier, float depthOffset, float deltaX, float deltaY,
  int centerNormalX, int centerNormalY, float normalErrorMultiplier
) {
  uint packedData = cortao_fetchPackedData(pixel + offset);
  float sampleDepth = cortao_unpackDepth(packedData) * depthMultiplier + depthOffset;
  float error = abs(deltaX * float(offset.x) + deltaY * float(offset.y) + sampleDepth);
  int normalX = cortao_unpackNormalX(packedData) - centerNormalX;
  int normalY = cortao_unpackNormalY(packedData) - centerNormalY;
  error += float(normalX * normalX + normalY * normalY) * normalErrorMultiplier;
  return exp2(-error);
}

void main(void) {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  uint centerPackedData = cortao_fetchPackedData(pixel);
  if (centerPackedData == 0u) {
    occlusionOutput = vec4(1.0);
    return;
  }

  // The depth slope comes from the 2x2 block of this pixel, as in the gather-based reference.
  ivec2 blockOrigin = (pixel >> 1) << 1;
  ivec2 blockOffset = pixel - blockOrigin;
  float depth00 = cortao_unpackDepth(cortao_fetchPackedData(blockOrigin));
  float depth10 = cortao_unpackDepth(cortao_fetchPackedData(blockOrigin + ivec2(1, 0)));
  float depth01 = cortao_unpackDepth(cortao_fetchPackedData(blockOrigin + ivec2(0, 1)));
  float depth11 = cortao_unpackDepth(cortao_fetchPackedData(blockOrigin + ivec2(1, 1)));
  float leftDepth = blockOffset.y == 0 ? depth00 : depth01;
  float rightDepth = blockOffset.y == 0 ? depth10 : depth11;
  float bottomDepth = blockOffset.x == 0 ? depth00 : depth10;
  float topDepth = blockOffset.x == 0 ? depth01 : depth11;

  float centerDepth = cortao_unpackDepth(centerPackedData);
  float inverseCenterDepth = 1.0 / centerDepth;
  float sensitivity = cortaoFilter.depthSensitivity;
  float deltaX = (leftDepth - rightDepth) * inverseCenterDepth * sensitivity;
  float deltaY = (bottomDepth - topDepth) * inverseCenterDepth * sensitivity;
  float depthMultiplier = sensitivity * inverseCenterDepth;
  float depthOffset = -sensitivity;
  int centerNormalX = cortao_unpackNormalX(centerPackedData);
  int centerNormalY = cortao_unpackNormalY(centerPackedData);
  float normalErrorMultiplier = cortaoFilter.normalSensitivity / float(1 << (CORTAO_PACKED_NORMAL_BITS / 2));

  float occlusionSum = cortao_fetchOcclusion(pixel);
  float weightSum = 1.0;

#if CORTAO_LARGE_FILTER
  const int SAMPLE_COUNT = 6;
  const ivec2 OFFSETS[6] = ivec2[6](
    ivec2(3, 0), ivec2(6, 0), ivec2(3, 3), ivec2(0, 3), ivec2(0, 6), ivec2(3, -3)
  );
#else
  const int SAMPLE_COUNT = 2;
  const ivec2 OFFSETS[2] = ivec2[2](ivec2(3, 0), ivec2(0, 3));
#endif

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    ivec2 offset = OFFSETS[i];
    float weightA = cortao_calculateWeight(
      pixel, -offset, depthMultiplier, depthOffset, deltaX, deltaY, centerNormalX, centerNormalY, normalErrorMultiplier
    );
    float weightB = cortao_calculateWeight(
      pixel, offset, depthMultiplier, depthOffset, deltaX, deltaY, centerNormalX, centerNormalY, normalErrorMultiplier
    );
#if CORTAO_FILTER_SYMMETRY
    float minWeight = min(weightA, weightB);
    weightA = minWeight;
    weightB = minWeight;
#endif
    weightSum += weightA + weightB;
    occlusionSum += cortao_fetchOcclusion(pixel - offset) * weightA;
    occlusionSum += cortao_fetchOcclusion(pixel + offset) * weightB;
  }

  occlusionOutput = vec4(occlusionSum / weightSum, 0.0, 0.0, 1.0);
}
`;
