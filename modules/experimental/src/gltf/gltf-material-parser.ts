import type {Device, Texture} from '@luma.gl/api';
import {log} from '@luma.gl/api';

import GL from '@luma.gl/webgl-legacy';
import {GLTFEnvironment} from './gltf-environment';

export type GLTFMaterialParserProps = {
  attributes: any;
  material: any;
  pbrDebug?: boolean;
  imageBasedLightingEnvironment?: GLTFEnvironment;
  lights: any;
  useTangents?: boolean;
};
export class GLTFMaterialParser {
  readonly device: Device;

  readonly defines: Record<string, number | boolean>;
  readonly uniforms: Record<string, any>;
  readonly parameters: Record<string, any>;
  readonly generatedTextures: Texture[];

  constructor(device: Device, props: GLTFMaterialParserProps) {
    const {attributes, material, pbrDebug, imageBasedLightingEnvironment, lights, useTangents} = props;
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
      u_Camera: [0, 0, 0], // Model should override

      u_MetallicRoughnessValues: [1, 1] // Default is 1 and 1
    };

    this.parameters = {};
    this.generatedTextures = [];

    if (imageBasedLightingEnvironment) {
      this.uniforms.u_DiffuseEnvSampler = imageBasedLightingEnvironment.getDiffuseEnvSampler();
      this.uniforms.u_SpecularEnvSampler = imageBasedLightingEnvironment.getSpecularEnvSampler();
      this.uniforms.u_brdfLUT = imageBasedLightingEnvironment.getBrdfTexture();
      this.uniforms.u_ScaleIBLAmbient = [1, 1];
    }

    if (pbrDebug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.uniforms.u_ScaleDiffBaseMR = [0, 0, 0, 0];
      this.uniforms.u_ScaleFGDSpec = [0, 0, 0, 0];
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

  defineIfPresent(value, name) {
    if (value) {
      this.defines[name] = 1;
    }
  }

  parseTexture(gltfTexture, name, define = null) {
    const parameters =
      (gltfTexture.texture &&
        gltfTexture.texture.sampler &&
        gltfTexture.texture.sampler.parameters) ||
      {};

    const image = gltfTexture.texture.source.image;
    let textureOptions;
    let specialTextureParameters = {};
    if (image.compressed) {
      textureOptions = image;
      specialTextureParameters = {
        [GL.TEXTURE_MIN_FILTER]:
          image.data.length > 1 ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR
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
    this.uniforms[name] = texture;
    this.defineIfPresent(define, define);
    this.generatedTextures.push(texture);
  }

  parsePbrMetallicRoughness(pbrMetallicRoughness) {
    if (pbrMetallicRoughness.baseColorTexture) {
      this.parseTexture(
        pbrMetallicRoughness.baseColorTexture,
        'u_BaseColorSampler',
        'HAS_BASECOLORMAP'
      );
    }
    this.uniforms.u_BaseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

    if (pbrMetallicRoughness.metallicRoughnessTexture) {
      this.parseTexture(
        pbrMetallicRoughness.metallicRoughnessTexture,
        'u_MetallicRoughnessSampler',
        'HAS_METALROUGHNESSMAP'
      );
    }
    const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
    this.uniforms.u_MetallicRoughnessValues = [metallicFactor, roughnessFactor];
  }

  parseMaterial(material) {
    this.uniforms.pbr_uUnlit = Boolean(material.unlit);

    if (material.pbrMetallicRoughness) {
      this.parsePbrMetallicRoughness(material.pbrMetallicRoughness);
    }
    if (material.normalTexture) {
      this.parseTexture(material.normalTexture, 'u_NormalSampler', 'HAS_NORMALMAP');

      const {scale = 1} = material.normalTexture;
      this.uniforms.u_NormalScale = scale;
    }
    if (material.occlusionTexture) {
      this.parseTexture(material.occlusionTexture, 'u_OcclusionSampler', 'HAS_OCCLUSIONMAP');

      const {strength = 1} = material.occlusionTexture;
      this.uniforms.u_OcclusionStrength = strength;
    }
    if (material.emissiveTexture) {
      this.parseTexture(material.emissiveTexture, 'u_EmissiveSampler', 'HAS_EMISSIVEMAP');
      this.uniforms.u_EmissiveFactor = material.emissiveFactor || [0, 0, 0];
    }
    if (material.alphaMode === 'MASK') {
      const {alphaCutoff = 0.5} = material;
      this.defines.ALPHA_CUTOFF = 1;
      this.uniforms.u_AlphaCutoff = alphaCutoff;
    } else if (material.alphaMode === 'BLEND') {
      log.warn('BLEND alphaMode might not work well because it requires mesh sorting')();
      Object.assign(this.parameters, {
        blend: true,
        blendEquation: GL.FUNC_ADD,
        blendFunc: [
          GL.SRC_ALPHA,
          GL.ONE_MINUS_SRC_ALPHA,
          GL.ONE,
          GL.ONE_MINUS_SRC_ALPHA
        ]
      });
    }
  }

  /**
   * Destroy all generated resources to release memory.
   */
  delete(): void {
    this.generatedTextures.forEach(texture => texture.destroy());
  }
}
