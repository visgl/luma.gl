// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Texture} from '@luma.gl/core';
import type {PBRSceneUniforms} from '@luma.gl/shaders';

/** Scene-level lighting controls; rotation is around the vertical axis in radians. */
export type PBRLightingEnvironmentOptions = {
  intensity?: number;
  rotation?: number;
};

/** Complete, borrowed linear-light environment resources for PBR rendering. */
export type PBRLightingEnvironment = PBRLightingEnvironmentOptions & {
  /** Normalized diffuse irradiance (E / pi). */
  diffuseTexture: Texture;
  /** GGX-prefiltered cubemap with the consumer's roughness-to-mip convention. */
  specularTexture: Texture;
  /** Split-sum BRDF integration lookup matching the consumer's convention. */
  brdfLUTTexture: Texture;
};

/** Returns shared IBL bindings without copying textures or transferring ownership. */
export function getPBREnvironmentBindings(environment: PBRLightingEnvironment) {
  const {diffuseTexture, specularTexture, brdfLUTTexture} = environment;
  // Environment resources must be live, on one device, with cube/cube/2D dimensions.
  assert(
    !diffuseTexture.destroyed &&
      !specularTexture.destroyed &&
      !brdfLUTTexture.destroyed &&
      diffuseTexture.device === specularTexture.device &&
      diffuseTexture.device === brdfLUTTexture.device &&
      diffuseTexture.dimension === 'cube' &&
      specularTexture.dimension === 'cube' &&
      brdfLUTTexture.dimension === '2d'
  );
  return {
    pbr_diffuseEnvSampler: diffuseTexture,
    pbr_specularEnvSampler: specularTexture,
    pbr_brdfLUT: brdfLUTTexture
  };
}

/** Returns scene uniforms. Call again after replacing a texture or changing lighting controls. */
export function getPBREnvironmentUniforms(
  environment: PBRLightingEnvironment
): Required<
  Pick<PBRSceneUniforms, 'environmentIntensity' | 'environmentRotation' | 'environmentMipCount'>
> {
  return {
    environmentIntensity: environment.intensity ?? 1,
    environmentRotation: environment.rotation ?? 0,
    environmentMipCount: environment.specularTexture.mipLevels
  };
}
