// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, SamplerProps} from '@luma.gl/core';
import {AsyncTexture} from '@luma.gl/engine';
import {loadImageTexture} from '@loaders.gl/textures';

/** Environment textures for PBR module */
export type PBREnvironment = {
  /** Bi-directional Reflectance Distribution Function (BRDF) lookup table */
  brdfLutTexture: AsyncTexture;
  diffuseEnvSampler: AsyncTexture;
  specularEnvSampler: AsyncTexture;
};

export type PBREnvironmentProps = {
  brdfLutUrl: string;
  getTexUrl: (name: string, dir: number, level: number) => string;
  specularMipLevels?: number;
};

/** Loads textures for PBR environment */
export function loadPBREnvironment(device: Device, props: PBREnvironmentProps): PBREnvironment {
  const brdfLutTexture = new AsyncTexture(device, {
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
      // @ts-ignore
      for (let lod = 0; lod <= props.specularMipLevels - 1; lod++) {
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

function makeCube(
  device: Device,
  {
    id,
    getTextureForFace,
    sampler
  }: {
    id: string;
    getTextureForFace: (dir: number) => Promise<any> | Promise<any>[];
    sampler: SamplerProps;
  }
): AsyncTexture {
  const data = {};
  FACES.forEach(face => {
    // @ts-ignore TODO
    data[String(face)] = getTextureForFace(face);
  });
  return new AsyncTexture(device, {
    id,
    dimension: 'cube',
    mipmaps: false,
    sampler,
    // @ts-expect-error
    data
  });
}
