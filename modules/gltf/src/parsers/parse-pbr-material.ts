// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Texture} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

import {log} from '@luma.gl/core';
import {type ParsedPBRMaterial} from '../pbr/pbr-material';
import {type PBREnvironment} from '../pbr/pbr-environment';
import {type PBRMaterialBindings} from '@luma.gl/shadertools';
import {convertSampler} from '../webgl-to-webgpu/convert-webgl-sampler';

// TODO - synchronize the GLTF... types with loaders.gl
// TODO - remove the glParameters, use only parameters

/* eslint-disable camelcase */

type GLTFTexture = {
  id: string;
  texture: {source: {image: any}; sampler: {parameters: any}};
  uniformName?: string;
  // is this on all textures?
  scale?: number;
  // is this on all textures?
  strength?: number;
};

type GLTFPBRMetallicRoughness = {
  baseColorTexture?: GLTFTexture;
  baseColorFactor?: [number, number, number, number];
  metallicRoughnessTexture?: GLTFTexture;
  metallicFactor?: number;
  roughnessFactor?: number;
};

type GLTFPBRMaterial = {
  unlit?: boolean;
  pbrMetallicRoughness?: GLTFPBRMetallicRoughness;
  normalTexture?: GLTFTexture;
  occlusionTexture?: GLTFTexture;
  emissiveTexture?: GLTFTexture;
  emissiveFactor?: [number, number, number];
  alphaMode?: 'MASK' | 'BLEND';
  alphaCutoff?: number;
};

export type ParsePBRMaterialOptions = {
  /** Debug PBR shader */
  pbrDebug?: boolean;
  /** Enable lights */
  lights?: any;
  /** Use tangents */
  useTangents?: boolean;
  /** provide an image based (texture cube) lighting environment */
  imageBasedLightingEnvironment?: PBREnvironment;
};

/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 */
export function parsePBRMaterial(
  device: Device,
  material: GLTFPBRMaterial,
  attributes: Record<string, any>,
  options: ParsePBRMaterialOptions
): ParsedPBRMaterial {
  const parsedMaterial: ParsedPBRMaterial = {
    defines: {
      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: true,
      SRGB_FAST_APPROXIMATION: true
    },
    bindings: {},
    uniforms: {
      // TODO: find better values?
      camera: [0, 0, 0], // Model should override

      metallicRoughnessValues: [1, 1] // Default is 1 and 1
    },
    parameters: {},
    glParameters: {},
    generatedTextures: []
  };

  // TODO - always available
  parsedMaterial.defines['USE_TEX_LOD'] = true;

  const {imageBasedLightingEnvironment} = options;
  if (imageBasedLightingEnvironment) {
    parsedMaterial.bindings.pbr_diffuseEnvSampler =
      imageBasedLightingEnvironment.diffuseEnvSampler.texture;
    parsedMaterial.bindings.pbr_specularEnvSampler =
      imageBasedLightingEnvironment.specularEnvSampler.texture;
    parsedMaterial.bindings.pbr_BrdfLUT = imageBasedLightingEnvironment.brdfLutTexture.texture;
    parsedMaterial.uniforms.scaleIBLAmbient = [1, 1];
  }

  if (options?.pbrDebug) {
    parsedMaterial.defines['PBR_DEBUG'] = true;
    // Override final color for reference app visualization of various parameters in the lighting equation.
    parsedMaterial.uniforms.scaleDiffBaseMR = [0, 0, 0, 0];
    parsedMaterial.uniforms.scaleFGDSpec = [0, 0, 0, 0];
  }

  if (attributes['NORMAL']) parsedMaterial.defines['HAS_NORMALS'] = true;
  if (attributes['TANGENT'] && options?.useTangents) parsedMaterial.defines['HAS_TANGENTS'] = true;
  if (attributes['TEXCOORD_0']) parsedMaterial.defines['HAS_UV'] = true;

  if (options?.imageBasedLightingEnvironment) parsedMaterial.defines['USE_IBL'] = true;
  if (options?.lights) parsedMaterial.defines['USE_LIGHTS'] = true;

  if (material) {
    parseMaterial(device, material, parsedMaterial);
  }

  return parsedMaterial;
}

/** Parse GLTF material record */
function parseMaterial(
  device: Device,
  material: GLTFPBRMaterial,
  parsedMaterial: ParsedPBRMaterial
): void {
  parsedMaterial.uniforms.unlit = Boolean(material.unlit);

  if (material.pbrMetallicRoughness) {
    parsePbrMetallicRoughness(device, material.pbrMetallicRoughness, parsedMaterial);
  }
  if (material.normalTexture) {
    addTexture(
      device,
      material.normalTexture,
      'pbr_normalSampler',
      'HAS_NORMALMAP',
      parsedMaterial
    );

    const {scale = 1} = material.normalTexture;
    parsedMaterial.uniforms.normalScale = scale;
  }
  if (material.occlusionTexture) {
    addTexture(
      device,
      material.occlusionTexture,
      'pbr_occlusionSampler',
      'HAS_OCCLUSIONMAP',
      parsedMaterial
    );

    const {strength = 1} = material.occlusionTexture;
    parsedMaterial.uniforms.occlusionStrength = strength;
  }
  if (material.emissiveTexture) {
    addTexture(
      device,
      material.emissiveTexture,
      'pbr_emissiveSampler',
      'HAS_EMISSIVEMAP',
      parsedMaterial
    );
    parsedMaterial.uniforms.emissiveFactor = material.emissiveFactor || [0, 0, 0];
  }

  switch (material.alphaMode || 'MASK') {
    case 'MASK':
      const {alphaCutoff = 0.5} = material;
      parsedMaterial.defines['ALPHA_CUTOFF'] = true;
      parsedMaterial.uniforms.alphaCutoff = alphaCutoff;
      break;
    case 'BLEND':
      log.warn('glTF BLEND alphaMode might not work well because it requires mesh sorting')();

      // WebGPU style parameters
      parsedMaterial.parameters.blend = true;

      parsedMaterial.parameters.blendColorOperation = 'add';
      parsedMaterial.parameters.blendColorSrcFactor = 'src-alpha';
      parsedMaterial.parameters.blendColorDstFactor = 'one-minus-src-alpha';

      parsedMaterial.parameters.blendAlphaOperation = 'add';
      parsedMaterial.parameters.blendAlphaSrcFactor = 'one';
      parsedMaterial.parameters.blendAlphaDstFactor = 'one-minus-src-alpha';

      // GL parameters
      // TODO - remove in favor of parameters
      parsedMaterial.glParameters['blend'] = true;
      parsedMaterial.glParameters['blendEquation'] = GL.FUNC_ADD;
      parsedMaterial.glParameters['blendFunc'] = [
        GL.SRC_ALPHA,
        GL.ONE_MINUS_SRC_ALPHA,
        GL.ONE,
        GL.ONE_MINUS_SRC_ALPHA
      ];

      break;
  }
}

/** Parse GLTF material sub record */
function parsePbrMetallicRoughness(
  device: Device,
  pbrMetallicRoughness: GLTFPBRMetallicRoughness,
  parsedMaterial: ParsedPBRMaterial
): void {
  if (pbrMetallicRoughness.baseColorTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.baseColorTexture,
      'pbr_baseColorSampler',
      'HAS_BASECOLORMAP',
      parsedMaterial
    );
  }
  parsedMaterial.uniforms.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

  if (pbrMetallicRoughness.metallicRoughnessTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.metallicRoughnessTexture,
      'pbr_metallicRoughnessSampler',
      'HAS_METALROUGHNESSMAP',
      parsedMaterial
    );
  }
  const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
  parsedMaterial.uniforms.metallicRoughnessValues = [metallicFactor, roughnessFactor];
}

/** Create a texture from a glTF texture/sampler/image combo and add it to bindings */
function addTexture(
  device: Device,
  gltfTexture: GLTFTexture,
  uniformName: keyof PBRMaterialBindings,
  define: string,
  parsedMaterial: ParsedPBRMaterial
): void {
  const image = gltfTexture.texture.source.image;
  let textureOptions;

  if (image.compressed) {
    textureOptions = image;
  } else {
    // Texture2D accepts a promise that returns an image as data (Async Textures)
    textureOptions = {data: image};
  }

  const gltfSampler = {
    wrapS: 10497, // default REPEAT S (U) wrapping mode.
    wrapT: 10497, // default REPEAT T (V) wrapping mode.
    ...gltfTexture?.texture?.sampler
  } as any;

  const texture: Texture = device.createTexture({
    id: gltfTexture.uniformName || gltfTexture.id,
    sampler: convertSampler(gltfSampler),
    ...textureOptions
  });

  parsedMaterial.bindings[uniformName] = texture;
  if (define) parsedMaterial.defines[define] = true;
  parsedMaterial.generatedTextures.push(texture);
}

/*
/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 *
export class PBRMaterialParser {
  readonly device: Device;

  readonly defines: Record<string, boolean>;
  readonly bindings: Record<string, Binding>;
  readonly uniforms: Record<string, any>;
  readonly parameters: Record<string, any>;

  /** Hold on to generated textures, we destroy them in the destroy method *
  readonly generatedTextures: Texture[];

  constructor(device: Device, props: PBRMaterialParserProps) {
    const {attributes, material, pbrDebug, imageBasedLightingEnvironment, lights, useTangents} =
      props;
    this.device = device;

    this.defines = {
      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: true,
      SRGB_FAST_APPROXIMATION: true
    };

    if (this.device.features.has('glsl-texture-lod')) {
      this.defines.USE_TEX_LOD = true;
    }

    this.uniforms = {
      // TODO: find better values?
      camera: [0, 0, 0], // Model should override

      metallicRoughnessValues: [1, 1] // Default is 1 and 1
    };

    this.bindings = {};

    this.parameters = {};
    this.generatedTextures = [];

    if (imageBasedLightingEnvironment) {
      this.bindings.pbr_diffuseEnvSampler = imageBasedLightingEnvironment.getDiffuseEnvSampler();
      this.bindings.pbr_specularEnvSampler = imageBasedLightingEnvironment.getSpecularEnvSampler();
      this.bindings.pbr_BrdfLUT = imageBasedLightingEnvironment.getBrdfTexture();
      this.uniforms.scaleIBLAmbient = [1, 1];
    }

    if (pbrDebug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.uniforms.scaleDiffBaseMR = [0, 0, 0, 0];
      this.uniforms.scaleFGDSpec = [0, 0, 0, 0];
    }

    this.defineIfPresent(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIfPresent(attributes.TANGENT && useTangents, 'HAS_TANGENTS');
    this.defineIfPresent(attributes.TEXCOORD_0, 'HAS_UV');

    this.defineIfPresent(imageBasedLightingEnvironment, 'USE_IBL');
    this.defineIfPresent(lights, 'USE_LIGHTS');
    this.defineIfPresent(pbrDebug, 'PBR_DEBUG');

    if (material) {
      this.parseMaterial(material);
    }
  }

  /**
   * Destroy all generated resources to release memory.
   *
  destroy(): void {
    this.generatedTextures.forEach(texture => texture.destroy());
  }

  /** Add a define if the the value is non-nullish *
  defineIfPresent(value: unknown, name: string): void {
    if (value) {
      this.defines[name] = 1;
    }
  }

  /** Parse GLTF material record *
  parseMaterial(material) {
    this.uniforms.unlit = Boolean(material.unlit);

    if (material.pbrMetallicRoughness) {
      this.parsePbrMetallicRoughness(material.pbrMetallicRoughness);
    }
    if (material.normalTexture) {
      this.addTexture(material.normalTexture, 'pbr_normalSampler', 'HAS_NORMALMAP');

      const {scale = 1} = material.normalTexture;
      this.uniforms.normalScale = scale;
    }
    if (material.occlusionTexture) {
      this.addTexture(material.occlusionTexture, 'pbr_occlusionSampler', 'HAS_OCCLUSIONMAP');

      const {strength = 1} = material.occlusionTexture;
      this.uniforms.occlusionStrength = strength;
    }
    if (material.emissiveTexture) {
      this.addTexture(material.emissiveTexture, 'pbr_emissiveSampler', 'HAS_EMISSIVEMAP');
      this.uniforms.emissiveFactor = material.emissiveFactor || [0, 0, 0];
    }
    if (material.alphaMode === 'MASK') {
      const {alphaCutoff = 0.5} = material;
      this.defines.ALPHA_CUTOFF = true;
      this.uniforms.u_AlphaCutoff = alphaCutoff;
    } else if (material.alphaMode === 'BLEND') {
      log.warn('BLEND alphaMode might not work well because it requires mesh sorting')();
      Object.assign(this.parameters, {
        blend: true,
        blendEquation: GL.FUNC_ADD,
        blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
      });
    }
  }

  /** Parse GLTF material sub record *
  parsePbrMetallicRoughness(pbrMetallicRoughness) {
    if (pbrMetallicRoughness.baseColorTexture) {
      this.addTexture(
        pbrMetallicRoughness.baseColorTexture,
        'pbr_baseColorSampler',
        'HAS_BASECOLORMAP'
      );
    }
    this.uniforms.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

    if (pbrMetallicRoughness.metallicRoughnessTexture) {
      this.addTexture(
        pbrMetallicRoughness.metallicRoughnessTexture,
        'pbr_metallicRoughnessSampler',
        'HAS_METALROUGHNESSMAP'
      );
    }
    const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
    this.uniforms.metallicRoughnessValues = [metallicFactor, roughnessFactor];
  }

  /** Create a texture from a glTF texture/sampler/image combo and add it to bindings *
  addTexture(gltfTexture, name, define = null) {
    const parameters = gltfTexture?.texture?.sampler?.parameters || {};

    const image = gltfTexture.texture.source.image;
    let textureOptions;
    let specialTextureParameters = {};
    if (image.compressed) {
      textureOptions = image;
      specialTextureParameters = {
        [GL.TEXTURE_MIN_FILTER]: image.data.length > 1 ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR
      };
    } else {
      // Texture2D accepts a promise that returns an image as data (Async Textures)
      textureOptions = {data: image};
    }

    const texture: Texture = this.device.createTexture({
      id: gltfTexture.name || gltfTexture.id,
      parameters: {
        ...parameters,
        ...specialTextureParameters
      },
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      },
      ...textureOptions
    });
    this.bindings[name] = texture;
    this.defineIfPresent(define, define);
    this.generatedTextures.push(texture);
  }
}
*/
