import {Device, SamplerProps, Texture} from '@luma.gl/core';
import {loadImageTexture} from '@loaders.gl/textures';

type TextureCube = Texture;

/** Environment textures for PBR module */
export type PBREnvironment = {
  /** Bi-directional Reflectance Distribution Function (BRDF) lookup table */
  brdfLutTexture: Texture;
  diffuseEnvSampler: TextureCube;
  specularEnvSampler: TextureCube;
};

export type PBREnvironmentProps = {
  brdfLutUrl: string;
  getTexUrl: (name: string, dir: number, level: number) => string;
  specularMipLevels?: number;
};

/** Loads textures for PBR environment */
export function loadPBREnvironment(device: Device, props: PBREnvironmentProps): PBREnvironment {
  const brdfLutTexture = device.createTexture({
    id: 'brdfLUT',
    sampler: {
      wrapS: 'clamp-to-edge',
      wrapT: 'clamp-to-edge',
      minFilter: 'linear',
      maxFilter: 'linear'
    } as SamplerProps,
    // Texture accepts a promise that returns an image as data (Async Textures)
    data: loadImageTexture(props.brdfLutUrl)
  });

  const diffuseEnvSampler = makeCube(device, {
    id: 'DiffuseEnvSampler',
    getTextureForFace: dir => loadImageTexture(props.getTexUrl('diffuse', dir, 0)),
    sampler: {
      wrapS: 'clamp-to-edge',
      wrapT: 'clamp-to-edge',
      minFilter: 'linear',
      maxFilter: 'linear'
    } as SamplerProps
  });

  const specularEnvSampler = makeCube(device, {
    id: 'SpecularEnvSampler',
    getTextureForFace: (dir: number) => {
      const imageArray = [];
      for (let lod = 0; lod <= props.specularMipLevels - 1; lod++) {
        imageArray.push(loadImageTexture(props.getTexUrl('specular', dir, lod)));
      }
      return imageArray;
    },
    sampler: {
      wrapS: 'clamp-to-edge',
      wrapT: 'clamp-to-edge',
      minFilter: 'linear', // [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
      maxFilter: 'linear'
    } as SamplerProps
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
): TextureCube {
  const data = {};
  FACES.forEach(face => {
    data[String(face)] = getTextureForFace(face);
  });
  return device.createTexture({
    id,
    dimension: 'cube',
    mipmaps: false,
    sampler,
    data
  });
}
