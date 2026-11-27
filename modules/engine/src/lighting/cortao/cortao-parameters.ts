// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Portions adapted from src/CORTAOParameters.h of the CORTAO reference implementation.
// SPDX-FileCopyrightText: Copyright (c) 2026 Daniel Isheden
// See THIRD-PARTY-NOTICES.md in this module.

/** The maximum number of mip levels in the packed data buffer. */
export const CORTAO_MAX_MIP_COUNT = 8;

/** The camera values that CORTAO needs. All distances are in view-space units. */
export type CORTAOCamera = {
  /** Column-major perspective projection from view space to clip space. */
  projectionMatrix: readonly number[];
  /** The distance to the near plane, in view-space units. */
  nearPlane: number;
  /** The distance to the far plane, in view-space units. */
  farPlane: number;
};

/** The user configuration that the per-pass uniforms derive from. */
export type CORTAOConfiguration = {
  /** Drawing buffer width, in pixels. */
  width: number;
  /** Drawing buffer height, in pixels. */
  height: number;
  /** Seed for the per-pixel noise. A constant seed prevents flicker without temporal filtering. */
  randomSeed: number;
  /** Maximum world-space radius, in view-space units. */
  radius: number;
  /** Maximum screen-space radius, as a fraction of the drawing buffer height. */
  maxScreenSpaceRadius: number;
  /** Mip level bias for the packed data reads in the main pass. */
  mipBias: number;
  /** Maximum enlargement of occluders that are seen at a grazing angle. */
  maxSlopeCompensation: number;
  /** Threshold that classifies an occluder as a back face. */
  backfaceThreshold: number;
  /** Extra enlargement of back-face occluders, from 0 to 1. */
  backfaceBoost: number;
  /** Exponent applied to the occlusion. 1 is the physically based result. */
  intensity: number;
  /** Depth sensitivity of the bilateral filter. */
  filterDepthSensitivity: number;
  /** Normal sensitivity of the bilateral filter. */
  filterNormalSensitivity: number;
};

/** Uniforms of the prepass. */
export type CORTAOPrepassUniforms = {
  unprojectParams: [number, number, number, number];
  resolution: [number, number];
  depthScale: number;
  depthOffset: number;
  randomSeed: number;
};

/** Uniforms of the mip atlas pass. */
export type CORTAOMipmapUniforms = {
  resolution: [number, number];
  mipCount: number;
  randomSeed: number;
};

/** Uniforms of the main pass. */
export type CORTAOMainPassUniforms = {
  unprojectParams: [number, number, number, number];
  projectionParams: [number, number, number, number];
  resolution: [number, number];
  normalBias: number;
  radius: number;
  maxApparentCircleRadiusCoefficient: number;
  mipBias: number;
  inverseMaxSlopeCompensation: number;
  backfaceThreshold: number;
  backfaceBoost: number;
  intensity: number;
  mipCount: number;
  randomSeed: number;
};

/** Uniforms of the filter pass. */
export type CORTAOFilterPassUniforms = {
  resolution: [number, number];
  depthSensitivity: number;
  normalSensitivity: number;
};

/** The largest finite 32-bit float. It stands in for an unlimited world-space radius. */
const MAX_FLOAT32 = 3.4028234663852886e38;

/**
 * Tests whether a column-major matrix is a perspective projection with only a field of view and
 * an optional off-center offset. CORTAO supports no other projection.
 */
export function isSupportedProjection(matrix: readonly number[]): boolean {
  const zeroIndices = [1, 2, 3, 4, 6, 7, 12, 13, 15];
  const epsilon = 1e-6;
  return (
    zeroIndices.every(index => Math.abs(matrix[index]) < epsilon) &&
    Math.abs(matrix[11] + 1) < epsilon &&
    matrix[0] !== 0 &&
    matrix[5] !== 0 &&
    matrix[14] !== 0
  );
}

/**
 * Gets the number of packed data mip levels. The smallest level keeps at least one pixel on the
 * short side, so that the levels of the mip atlas do not overlap.
 */
export function getCORTAOMipCount(width: number, height: number): number {
  const shortSide = Math.max(1, Math.min(width, height));
  return Math.min(CORTAO_MAX_MIP_COUNT, Math.floor(Math.log2(shortSide)) + 1);
}

/** Gets the size of the packed data mip atlas. Level 0 is on the left, levels 1 and up on the right. */
export function getCORTAOMipAtlasSize(width: number, height: number): [number, number] {
  return [width + Math.max(width >> 1, 1), height];
}

/** Gets the prepass uniforms. Port of `populatePrepassParameters()`. */
export function getCORTAOPrepassUniforms(
  camera: CORTAOCamera,
  configuration: CORTAOConfiguration
): CORTAOPrepassUniforms {
  const {nearPlane, farPlane} = camera;
  let depthScale: number;
  let depthOffset: number;
  if (!Number.isFinite(nearPlane)) {
    // Infinite near plane (reverse depth).
    depthScale = 1 / farPlane;
    depthOffset = 0;
  } else if (!Number.isFinite(farPlane)) {
    // Infinite far plane.
    depthScale = -1 / nearPlane;
    depthOffset = 1 / nearPlane;
  } else {
    // Finite near and far planes. Reverse depth gives a positive scale.
    depthScale = (nearPlane - farPlane) / (nearPlane * farPlane);
    depthOffset = 1 / nearPlane;
  }
  return {
    unprojectParams: getUnprojectParams(camera.projectionMatrix),
    resolution: [configuration.width, configuration.height],
    depthScale,
    depthOffset,
    randomSeed: configuration.randomSeed >>> 0
  };
}

/** Gets the mip atlas uniforms. */
export function getCORTAOMipmapUniforms(configuration: CORTAOConfiguration): CORTAOMipmapUniforms {
  return {
    resolution: [configuration.width, configuration.height],
    mipCount: getCORTAOMipCount(configuration.width, configuration.height),
    randomSeed: configuration.randomSeed >>> 0
  };
}

/** Gets the main pass uniforms. Port of `populateMainPassParameters()`, without the Y flip. */
export function getCORTAOMainPassUniforms(
  camera: CORTAOCamera,
  configuration: CORTAOConfiguration
): CORTAOMainPassUniforms {
  const matrix = camera.projectionMatrix;
  const projectionX = matrix[0];
  const projectionY = matrix[5];
  const projectionOffsetX = matrix[8];
  const projectionOffsetY = matrix[9];
  const inverseY = 1 / projectionY;
  const maxApparentCircleRadius = inverseY * configuration.maxScreenSpaceRadius * 2;
  return {
    unprojectParams: getUnprojectParams(matrix),
    // WebGL textures and clip space both have +Y up, so CORTAO's flipY is false.
    projectionParams: [
      0.5 * projectionX,
      0.5 * projectionY,
      -0.5 + 0.5 * projectionOffsetX,
      -0.5 + 0.5 * projectionOffsetY
    ],
    resolution: [configuration.width, configuration.height],
    normalBias: (1 / projectionX / configuration.width) * Math.SQRT2,
    radius: Math.min(configuration.radius, MAX_FLOAT32),
    maxApparentCircleRadiusCoefficient:
      maxApparentCircleRadius / Math.sqrt(maxApparentCircleRadius * maxApparentCircleRadius + 1),
    mipBias: Math.log2(projectionY * configuration.height * 0.5) + configuration.mipBias,
    inverseMaxSlopeCompensation: 1 / configuration.maxSlopeCompensation,
    backfaceThreshold: configuration.backfaceThreshold,
    backfaceBoost: configuration.backfaceBoost,
    intensity: configuration.intensity,
    mipCount: getCORTAOMipCount(configuration.width, configuration.height),
    randomSeed: configuration.randomSeed >>> 0
  };
}

/** Gets the filter pass uniforms. Port of `populateFilterPassParameters()`. */
export function getCORTAOFilterPassUniforms(
  configuration: CORTAOConfiguration
): CORTAOFilterPassUniforms {
  return {
    resolution: [configuration.width, configuration.height],
    depthSensitivity: configuration.filterDepthSensitivity,
    normalSensitivity: configuration.filterNormalSensitivity
  };
}

/**
 * Gets the parameters that map a texture coordinate to a view-space direction at depth 1.
 * The inverse of the projection form that CORTAO supports has these entries in closed form.
 */
function getUnprojectParams(matrix: readonly number[]): [number, number, number, number] {
  const inverseX = 1 / matrix[0];
  const inverseY = 1 / matrix[5];
  const inverseOffsetX = matrix[8] / matrix[0];
  const inverseOffsetY = matrix[9] / matrix[5];
  return [2 * inverseX, 2 * inverseY, -inverseX + inverseOffsetX, -inverseY + inverseOffsetY];
}
