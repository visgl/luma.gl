// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Portions adapted from the CORTAO reference implementation.
// SPDX-FileCopyrightText: Copyright (c) 2026 Daniel Isheden
// See THIRD-PARTY-NOTICES.md in this module.

/** Ray counts that have a CORTAO occluder lookup table. */
export type CORTAORayCount = 8 | 16 | 32;

/** Options for {@link createOccluderLookupTable}. */
export type OccluderLookupTableOptions = {
  /** The number of rays per pixel. Each texel stores one bit per ray. */
  rayCount: CORTAORayCount;
  /** The X and Y resolution of the sphere-map direction axes. */
  directionResolution?: number;
  /** The Z resolution of the occluder radius axis. */
  radiusResolution?: number;
};

/** The texels of an occluder lookup table, with X as the fastest axis. */
export type OccluderLookupTable = {
  /** One unsigned integer of ray bits for each texel. */
  data: Uint8Array | Uint16Array | Uint32Array;
  /** The X and Y size of the table, in texels. */
  directionResolution: number;
  /** The Z size of the table, in texels. */
  radiusResolution: number;
  /** The integer texture format that holds one texel. */
  format: 'r8uint' | 'r16uint' | 'r32uint';
};

/** The default direction resolution. CORTAO recommends 24 for up to 32 samples. */
export const OCCLUDER_LOOKUP_DIRECTION_RESOLUTION = 24;
/** The default radius resolution. CORTAO recommends 16 for up to 32 samples. */
export const OCCLUDER_LOOKUP_RADIUS_RESOLUTION = 16;

/** The golden angle, PI * (3 - sqrt(5)). */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Creates the CORTAO occluder lookup table.
 *
 * Each texel holds the set of rays that an occluder blocks. The occluder has a tangent-space
 * direction (sphere-map encoded on X and Y) and an angular radius (on Z). This is a port of
 * `utils/generators/OccluderLookupTableGenerator.py` in the reference repository. The output is
 * identical to the `.bin` tables in that repository.
 */
export function createOccluderLookupTable(
  options: OccluderLookupTableOptions
): OccluderLookupTable {
  const {
    rayCount,
    directionResolution = OCCLUDER_LOOKUP_DIRECTION_RESOLUTION,
    radiusResolution = OCCLUDER_LOOKUP_RADIUS_RESOLUTION
  } = options;
  const maxOccluderRadius = Math.SQRT2;
  const rayDirections = getRayDirections(rayCount);
  const texelCount = directionResolution * directionResolution * radiusResolution;
  const data =
    rayCount <= 8
      ? new Uint8Array(texelCount)
      : rayCount <= 16
        ? new Uint16Array(texelCount)
        : new Uint32Array(texelCount);

  for (let z = 0; z < radiusResolution; z++) {
    const occluderRadius = (maxOccluderRadius * (z + 0.5)) / radiusResolution;
    const occluderCosAngle = 1 - occluderRadius * occluderRadius * 0.5;
    const sliceOffset = z * directionResolution * directionResolution;
    const closestTexel = new Array<number>(rayCount).fill(-1);
    const closestCosAngle = new Array<number>(rayCount).fill(-1);

    for (let y = 0; y < directionResolution; y++) {
      for (let x = 0; x < directionResolution; x++) {
        const direction = decodeSphereMap(
          (x + 0.5) / directionResolution,
          (y + 0.5) / directionResolution
        );
        const texelIndex = y * directionResolution + x;
        let rayBits = 0;
        if (direction[2] !== -1) {
          for (let rayIndex = 0; rayIndex < rayCount; rayIndex++) {
            const cosAngle = dot(direction, rayDirections[rayIndex]);
            if (cosAngle > closestCosAngle[rayIndex]) {
              closestTexel[rayIndex] = texelIndex;
              closestCosAngle[rayIndex] = cosAngle;
            }
            if (cosAngle > occluderCosAngle) {
              rayBits |= 1 << rayIndex;
            }
          }
        }
        data[sliceOffset + texelIndex] = rayBits >>> 0;
      }
    }

    // Each ray is always blocked by the texel that is nearest to it, so that small occluders
    // that point straight at a ray do not fall between the texel centers.
    for (let rayIndex = 0; rayIndex < rayCount; rayIndex++) {
      const index = sliceOffset + closestTexel[rayIndex];
      data[index] = (data[index] | (1 << rayIndex)) >>> 0;
    }
  }

  const format = rayCount <= 8 ? 'r8uint' : rayCount <= 16 ? 'r16uint' : 'r32uint';
  return {data, directionResolution, radiusResolution, format};
}

/**
 * Gets the tangent-space ray directions. The rays lie on a golden-angle spiral with a cosine
 * distribution. The main pass shader uses the same formula.
 */
export function getRayDirections(rayCount: number): [number, number, number][] {
  const directions: [number, number, number][] = [];
  for (let rayIndex = 0; rayIndex < rayCount; rayIndex++) {
    const angle = rayIndex * GOLDEN_ANGLE;
    const radius = Math.sqrt((rayIndex + 0.5) / rayCount);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    directions.push([x, y, Math.sqrt(1 - x * x - y * y)]);
  }
  return directions;
}

/** Decodes a sphere-map coordinate in [0, 1] to a unit direction. */
function decodeSphereMap(x: number, y: number): [number, number, number] {
  const encodedX = x * 2 - 1;
  const encodedY = y * 2 - 1;
  const z = Math.max(1 - encodedX * encodedX - encodedY * encodedY, 0);
  const scale = 2 * Math.sqrt(z);
  return [encodedX * scale, encodedY * scale, z * 2 - 1];
}

/** Gets the dot product of two 3D vectors. */
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
