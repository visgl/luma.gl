import type {Device, Texture, Parameters} from '@luma.gl/core';
import {log} from '@luma.gl/core';
import {PBREnvironment} from './pbr-environment';
import {PBRMaterialBindings, PBRMaterialUniforms, PBRProjectionProps} from '@luma.gl/shadertools';

/* eslint-disable camelcase */

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

export type ParsedPBRMaterial = {
  readonly defines: Record<string, number | boolean>;
  readonly bindings: Partial<PBRMaterialBindings>;
  readonly uniforms: Partial<PBRProjectionProps & PBRMaterialUniforms>;
  readonly parameters: Parameters;
  readonly glParameters: Record<string, any>;
  /** List of all generated textures, makes it easy to destroy them later */
  readonly generatedTextures: Texture[];
};

// NOTE: Modules other than `@luma.gl/webgl` should not import `GL` from
// `@luma.gl/constants`. Locally we use `GLEnum` instead of `GL` to avoid
// conflicts with the `babel-plugin-inline-webgl-constants` plugin.
// eslint-disable-next-line no-shadow
enum GLEnum {
  FUNC_ADD = 0x8006,
  ONE = 1,
  SRC_ALPHA = 0x0302,
  ONE_MINUS_SRC_ALPHA = 0x0303,
  TEXTURE_MIN_FILTER = 0x2801,
  LINEAR = 0x2601,
  LINEAR_MIPMAP_NEAREST = 0x2701,
  UNPACK_FLIP_Y_WEBGL = 0x9240
}

/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 */
export function parsePBRMaterial(
  device: Device,
  material,
  attributes: Record<string, any>,
  options: ParsePBRMaterialOptions
): ParsedPBRMaterial {
  const parsedMaterial: ParsedPBRMaterial = {
    defines: {
      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: 1,
      SRGB_FAST_APPROXIMATION: 1
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
  parsedMaterial.defines.USE_TEX_LOD = 1;

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
    parsedMaterial.defines.PBR_DEBUG = 1;
    // Override final color for reference app visualization of various parameters in the lighting equation.
    parsedMaterial.uniforms.scaleDiffBaseMR = [0, 0, 0, 0];
    parsedMaterial.uniforms.scaleFGDSpec = [0, 0, 0, 0];
  }

  if (attributes.NORMAL) parsedMaterial.defines.HAS_NORMALS = 1;
  if (attributes.TANGENT && options?.useTangents) parsedMaterial.defines.HAS_TANGENTS = 1;
  if (attributes.TEXCOORD_0) parsedMaterial.defines.HAS_UV = 1;

  if (options?.imageBasedLightingEnvironment) parsedMaterial.defines.USE_IBL = 1;
  if (options?.lights) parsedMaterial.defines.USE_LIGHTS = 1;

  if (material) {
    parseMaterial(device, material, parsedMaterial);
  }

  return parsedMaterial;
}

/** Parse GLTF material record */
function parseMaterial(device: Device, material, parsedMaterial: ParsedPBRMaterial): void {
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

  switch (material.alphaMode) {
    case 'MASK':
      const {alphaCutoff = 0.5} = material;
      parsedMaterial.defines.ALPHA_CUTOFF = 1;
      parsedMaterial.uniforms.alphaCutoff = alphaCutoff;
      break;
    case 'BLEND':
      log.warn('glTF BLEND alphaMode might not work well because it requires mesh sorting')();

      // WebGPU style parameters
      parsedMaterial.parameters.blendColorOperation = 'add';
      parsedMaterial.parameters.blendColorSrcFactor = 'src-alpha';
      parsedMaterial.parameters.blendColorDstFactor = 'one-minus-src-alpha';

      parsedMaterial.parameters.blendAlphaOperation = 'add';
      parsedMaterial.parameters.blendAlphaSrcFactor = 'one';
      parsedMaterial.parameters.blendAlphaDstFactor = 'one-minus-src-alpha';

      // GL parameters
      parsedMaterial.glParameters.blend = true;
      parsedMaterial.glParameters.blendEquation = GLEnum.FUNC_ADD;
      parsedMaterial.glParameters.blendFunc = [
        GLEnum.SRC_ALPHA,
        GLEnum.ONE_MINUS_SRC_ALPHA,
        GLEnum.ONE,
        GLEnum.ONE_MINUS_SRC_ALPHA
      ];

      break;
  }
}

/** Parse GLTF material sub record */
function parsePbrMetallicRoughness(
  device: Device,
  pbrMetallicRoughness,
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
  gltfTexture,
  uniformName: string,
  define = null,
  parsedMaterial: ParsedPBRMaterial
): void {
  const parameters = gltfTexture?.texture?.sampler?.parameters || {};

  const image = gltfTexture.texture.source.image;
  let textureOptions;
  let specialTextureParameters = {};
  if (image.compressed) {
    textureOptions = image;
    specialTextureParameters = {
      [GLEnum.TEXTURE_MIN_FILTER]:
        image.data.length > 1 ? GLEnum.LINEAR_MIPMAP_NEAREST : GLEnum.LINEAR
    };
  } else {
    // Texture2D accepts a promise that returns an image as data (Async Textures)
    textureOptions = {data: image};
  }

  const texture: Texture = device.createTexture({
    id: gltfTexture.uniformName || gltfTexture.id,
    parameters: {
      ...parameters,
      ...specialTextureParameters
    },
    pixelStore: {
      [GLEnum.UNPACK_FLIP_Y_WEBGL]: false
    },
    ...textureOptions
  });
  parsedMaterial.bindings[uniformName] = texture;
  if (define) parsedMaterial.defines[define] = 1;
  parsedMaterial.generatedTextures.push(texture);
}

/*
/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 *
export class PBRMaterialParser {
  readonly device: Device;

  readonly defines: Record<string, number | boolean>;
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
      MANUAL_SRGB: 1,
      SRGB_FAST_APPROXIMATION: 1
    };

    if (this.device.features.has('glsl-texture-lod')) {
      this.defines.USE_TEX_LOD = 1;
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
      this.defines.ALPHA_CUTOFF = 1;
      this.uniforms.alphaCutoff = alphaCutoff;
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
