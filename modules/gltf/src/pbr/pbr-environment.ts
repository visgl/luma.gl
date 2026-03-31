// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, SamplerProps} from '@luma.gl/core';
import {
  DynamicTexture,
  type Texture2DData,
  type TextureCubeData,
  type TextureCubeFace
} from '@luma.gl/engine';
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
    data: loadImageTexture(resolveTextureUrl(props.brdfLutUrl))
  });

  const diffuseEnvSampler = makeCube(device, {
    id: 'DiffuseEnvSampler',
    getTextureForFace: face =>
      loadImageTexture(
        resolveTextureUrl(props.getTexUrl('diffuse', FACES.indexOf(face), 0))
      ) as Promise<Texture2DData>,
    sampler: {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      magFilter: 'linear'
    } as const satisfies SamplerProps
  });

  const specularEnvSampler = makeCube(device, {
    id: 'SpecularEnvSampler',
    getTextureForFace: (face: TextureCubeFace) => {
      const imageArray: Array<Promise<unknown>> = [];
      const direction = FACES.indexOf(face);
      for (let lod = 0; lod < specularMipLevels; lod++) {
        imageArray.push(
          loadImageTexture(resolveTextureUrl(props.getTexUrl('specular', direction, lod)))
        );
      }
      return Promise.all(imageArray) as Promise<Texture2DData>;
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
const FACES: TextureCubeFace[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

function resolveTextureUrl(url: string): string {
  const baseUrl = globalThis.document?.baseURI ?? globalThis.location?.href;
  return baseUrl ? new URL(url, baseUrl).toString() : url;
}

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
    /** Returns the image or mip-array promise for one cubemap face. */
    getTextureForFace: (face: TextureCubeFace) => Promise<Texture2DData>;
    /** Sampler configuration shared across faces. */
    sampler: SamplerProps;
  }
): DynamicTexture {
  const data: Promise<TextureCubeData> = Promise.all(
    FACES.map(face => getTextureForFace(face))
  ).then(faceDataArray => {
    const cubeData = {} as TextureCubeData;
    FACES.forEach((face, index) => {
      cubeData[face] = faceDataArray[index];
    });
    return cubeData;
  });
  return new DynamicTexture(device, {
    id,
    dimension: 'cube',
    mipmaps: false,
    sampler,
    data
  });
}
