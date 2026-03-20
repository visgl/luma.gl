// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, SamplerProps} from '@luma.gl/core';
import {DynamicTexture} from '@luma.gl/engine';
import {loadImageTexture} from '@loaders.gl/textures';

/** Environment textures for PBR module */
export type PBREnvironment = {
  /** Bi-directional Reflectance Distribution Function (BRDF) lookup table */
  brdfLutTexture: DynamicTexture;
  /** Diffuse irradiance cubemap. */
  diffuseEnvSampler: DynamicTexture;
  /** Specular reflection cubemap with mip chain. */
  specularEnvSampler: DynamicTexture;
};

/** Configuration used to load an image-based lighting environment. */
export type PBREnvironmentProps = {
  /** URL of the BRDF lookup texture. */
  brdfLutUrl: string;
  /** Callback that returns the URL for a diffuse or specular cubemap face and mip level. */
  getTexUrl: (name: string, dir: number, level: number) => string;
  /** Number of mip levels in the specular environment map. */
  specularMipLevels?: number;
};

/** Loads textures for PBR environment */
export function loadPBREnvironment(device: Device, props: PBREnvironmentProps): PBREnvironment {
  const specularMipLevels = props.specularMipLevels ?? 1;

  const brdfLutTexture = new DynamicTexture(device, {
    id: 'brdfLUT',
    sampler: {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      magFilter: 'linear'
    } as const satisfies SamplerProps,
    // Texture accepts a promise that returns an image as data (Async Textures)
    data: loadImageTexture(props.brdfLutUrl)
  });

  const diffuseEnvSampler = makeCube(device, {
    id: 'DiffuseEnvSampler',
    getTextureForFace: dir => loadImageTexture(props.getTexUrl('diffuse', dir, 0)),
    sampler: {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      magFilter: 'linear'
    } as const satisfies SamplerProps
  });

  const specularEnvSampler = makeCube(device, {
    id: 'SpecularEnvSampler',
    getTextureForFace: (dir: number) => {
      const imageArray: Promise<any>[] = [];
      for (let lod = 0; lod < specularMipLevels; lod++) {
        imageArray.push(loadImageTexture(props.getTexUrl('specular', dir, lod)));
      }
      return imageArray;
    },
    sampler: {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear', // [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
      magFilter: 'linear'
    } as const satisfies SamplerProps
  });

  return {
    brdfLutTexture,
    diffuseEnvSampler,
    specularEnvSampler
  };
}

// TODO put somewhere common
const FACES = [0, 1, 2, 3, 4, 5];
const CUBE_FACE_NAMES = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'] as const;

/** Construction props for an asynchronously loaded cubemap. */
function makeCube(
  device: Device,
  {
    id,
    getTextureForFace,
    sampler
  }: {
    /** Debug id assigned to the created texture. */
    id: string;
    /** Returns the image promise or mip-array promises for one cubemap face. */
    getTextureForFace: (dir: number) => Promise<any> | Promise<any>[];
    /** Sampler configuration shared across faces. */
    sampler: SamplerProps;
  }
): DynamicTexture {
  const data = {} as Record<(typeof CUBE_FACE_NAMES)[number], Promise<any> | Promise<any>[]>;
  FACES.forEach(face => {
    data[CUBE_FACE_NAMES[face]] = getTextureForFace(face);
  });
  return new DynamicTexture(device, {
    id,
    dimension: 'cube',
    mipmaps: false,
    sampler,
    // @ts-expect-error
    data
  });
}
