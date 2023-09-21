import type {Device, Texture, TextureProps} from '@luma.gl/api';
import {log} from '@luma.gl/api';
import {GLParameters, GLSamplerParameters} from '@luma.gl/webgl';
import {GL} from '@luma.gl/webgl-legacy';
import {PBRMaterialSettings, tiltShift} from '@luma.gl/shadertools';

import {GLTFEnvironment} from './gltf-environment';

export type GLTFMaterialProps = {
  attributes: any;
  material: any;
  pbrDebug?: boolean;
  imageBasedLightingEnvironment?: GLTFEnvironment;
  lights: any;
  useTangents?: boolean;
};

export class GLTFMaterial {
  readonly device: Device;

  pbrMaterial: Partial<PBRMaterialSettings> = {
    metallicRoughnessValues: [1, 1] // Default is 1 and 1
  };
  readonly parameters: GLParameters = {};
  readonly generatedTextures: Texture[] = [];
  readonly defines: Record<string, number | boolean>  = {
    // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
    MANUAL_SRGB: 1,
    SRGB_FAST_APPROXIMATION: 1
  };

  constructor(device: Device, props: GLTFMaterialProps) {
    const {attributes, material, pbrDebug, imageBasedLightingEnvironment, lights, useTangents} = props;
    this.device = device;

    if (material) {
      this.parseMaterial(material);
    }

    if (imageBasedLightingEnvironment) {
      this.pbrMaterial.diffuseEnvSampler = imageBasedLightingEnvironment.getDiffuseEnvSampler();
      this.pbrMaterial.specularEnvSampler = imageBasedLightingEnvironment.getSpecularEnvSampler();
      this.pbrMaterial.brdfLUT = imageBasedLightingEnvironment.getBrdfTexture();
      this.pbrMaterial.scaleIBLAmbient = [1, 1];
    }

    if (pbrDebug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.pbrMaterial.scaleDiffBaseMR = [0, 0, 0, 0];
      this.pbrMaterial.scaleFGDSpec = [0, 0, 0, 0];
    }

    this.defineIf(this.device.features.has('glsl-texture-lod'), 'USE_TEX_LOD');

    this.defineIf(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIf(attributes.TANGENT && useTangents, 'HAS_TANGENTS');
    this.defineIf(attributes.TEXCOORD_0, 'HAS_UV');

    this.defineIf(imageBasedLightingEnvironment, 'USE_IBL');
    this.defineIf(lights, 'USE_LIGHTS');
    this.defineIf(pbrDebug, 'PBR_DEBUG');
  }

  /**
   * Destroy all generated resources to release memory.
   */
  destroy(): void {
    this.generatedTextures.forEach(texture => texture.destroy());
  }

  /** @deprecated Use .destroy() */
  delete(): void {
    this.destroy();
  }
  
  // INTERNAL METHODS

  /** Conditionally add a define */
  defineIf(value, name) {
    if (value) {
      this.defines[name] = 1;
    }
  }

  /** Parse a GLTF Encoded PBR material */
  parseMaterial(material) {
    this.pbrMaterial.unlit = Boolean(material.unlit);

    if (material.pbrMetallicRoughness) {
      this.parsePbrMetallicRoughness(material.pbrMetallicRoughness);
    }

    if (material.normalTexture) {
      this.pbrMaterial.normalSampler = this.parseTexture(material.normalTexture);
      this.defineIf(true, 'HAS_NORMALMAP');

      const {scale = 1} = material.normalTexture;
      this.pbrMaterial.normalScale = scale;
    }

    if (material.occlusionTexture) {
      this.pbrMaterial.occlusionSampler = this.parseTexture(material.occlusionTexture);
      this.definedIf(true, 'HAS_OCCLUSIONMAP');

      const {strength = 1} = material.occlusionTexture;
      this.pbrMaterial.occlusionStrength = strength;
    }

    if (material.emissiveTexture) {
      this.pbrMaterial.emissiveSampler = this.parseTexture(material.emissiveTexture);
      this.defineIf(true, 'HAS_EMISSIVEMAP');
      this.pbrMaterial.emissiveFactor = material.emissiveFactor || [0, 0, 0];
    }

    switch (material.alphaMode) {
      case 'MASK':
        const {alphaCutoff = 0.5} = material;
        this.defines.ALPHA_CUTOFF = 1;
        this.pbrMaterial.alphaCutoff = alphaCutoff;
        break;
      case 'BLEND':
        log.warn('BLEND alphaMode might not work well because it requires mesh sorting')();
        this.parameters.blend = true;
        this.parameters.blendEquation = GL.FUNC_ADD;
        this.parameters.blendFunc = [
          GL.SRC_ALPHA,
          GL.ONE_MINUS_SRC_ALPHA,
          GL.ONE,
          GL.ONE_MINUS_SRC_ALPHA
        ];
        break;
      default: 
        // ignore for now
    }
  }

  /** Parse the metallic roughness section */
  parsePbrMetallicRoughness(pbrMetallicRoughness) {
    if (pbrMetallicRoughness.baseColorTexture) {
      this.pbrMaterial.baseColorSampler = this.parseTexture(pbrMetallicRoughness.baseColorTexture);
      this.defineIf(true, 'HAS_BASECOLORMAP');
    }
    this.pbrMaterial.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

    if (pbrMetallicRoughness.metallicRoughnessTexture) {
      this.pbrMaterial.metallicRoughnessSampler = this.parseTexture(pbrMetallicRoughness.metallicRoughnessTexture);
      this.defineIf(true, 'HAS_METALROUGHNESSMAP');
    }
    const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
    this.pbrMaterial.metallicRoughnessValues = [metallicFactor, roughnessFactor];
  }

  /** Parse one glTF-encoded texture */
  parseTexture(gltfTexture, define?: string): Texture {
    const parameters = gltfTexture.texture?.sampler?.parameters || {};

    const image = gltfTexture.texture.source.image;
    let textureProps: TextureProps;
    let specialTextureParameters: GLSamplerParameters = {};
    if (image.compressed) {
      textureProps = image;
      specialTextureParameters[GL.TEXTURE_MIN_FILTER] =
          image.data.length > 1 ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR
    } else {
      // Texture2D accepts a promise that returns an image as data (Async Textures)
      textureProps = {data: image};
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
      ...textureProps
    });
    this.generatedTextures.push(texture);
    return texture;
  }
}
