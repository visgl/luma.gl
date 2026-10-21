// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Pinned KHR_materials_scatter multi-scatter to single-scatter albedo conversion. */
export function getSingleScatterAlbedo(multiscatterAlbedo: number, anisotropy: number): number {
  // The draft requires an exact zero to recover absorption-only volume transport.
  if (multiscatterAlbedo === 0) return 0;
  const intermediate = Math.min(
    1,
    Math.max(
      0,
      4.09712 +
        4.20863 * multiscatterAlbedo -
        Math.sqrt(9.59217 + 41.6808 * multiscatterAlbedo + 17.7126 * multiscatterAlbedo ** 2)
    )
  );
  return (1 - intermediate ** 2) / (1 - anisotropy * intermediate ** 2);
}

/** Evaluate the draft thin-wall diffuse BSDF without the outer dielectric Fresnel layer. */
export function getThinWallScatterWeights(
  strength: number,
  transmission: number,
  anisotropy: number
) {
  const scatteredTransmission = strength * transmission;
  return {
    specularTransmission: transmission * (1 - strength),
    diffuseTransmission: (scatteredTransmission * (1 + anisotropy)) / 2,
    diffuseReflection: (scatteredTransmission * (1 - anisotropy)) / 2
  };
}
