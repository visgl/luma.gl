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

/** Split volume extinction into scattering and absorption using the pinned draft model. */
export function getScatterVolumeCoefficients(
  attenuationColor: readonly number[],
  attenuationDistance: number,
  multiscatterColor: readonly number[],
  strength: number,
  anisotropy: number
): {extinction: number[]; scattering: number[]; absorption: number[]} {
  const extinction = attenuationColor.map(color =>
    attenuationDistance === Infinity || color === 1 ? 0 : -Math.log(color) / attenuationDistance
  );
  const scattering = extinction.map((coefficient, channel) => {
    const albedo = getSingleScatterAlbedo(multiscatterColor[channel] * strength, anisotropy);
    // Preserve absorption-only transport exactly, including an opaque color channel.
    return albedo === 0 ? 0 : coefficient * albedo;
  });
  const absorption = extinction.map((coefficient, channel) =>
    scattering[channel] === coefficient ? 0 : coefficient - scattering[channel]
  );
  return {extinction, scattering, absorption};
}
