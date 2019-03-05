import {Texture2D, TextureCube} from '../../webgl';
import {loadImage} from '../../core/load-file';
import log from '../../utils/log';

// TODO: Move to new file
class GLTFEnv {
  constructor(gl) {
    this.gl = gl;
  }

  getTexUrl(envMap, type, dir, mipLevel = 0) {
    return `https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/${envMap}/${type}/${type}_${dir}_${mipLevel}.jpg`;
  }

  getBrdfUrl() {
    return 'https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/brdfLUT.png';
  }

  makeCube(id, func) {
    return Promise.all([
      func('right'),
      func('top'),
      func('front'),
      func('left'),
      func('bottom'),
      func('back')
    ]).then(faces => {
      return new TextureCube(this.gl, {
        id,
        pixels: {
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_X]: faces[0],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y]: faces[1],
          [this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z]: faces[2],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X]: faces[3],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y]: faces[4],
          [this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]: faces[5]
        }
      });
    });
  }

  getDiffuseEnvSampler() {
    if (!this._DiffuseEnvSampler) {
      this._DiffuseEnvSampler = this.makeCube('DiffuseEnvSampler', dir =>
        loadImage(this.getTexUrl('papermill', 'diffuse', dir))
      );
    }

    return this._DiffuseEnvSampler;
  }

  getSpecularEnvSampler() {
    if (!this._SpecularEnvSampler) {
      this._SpecularEnvSampler = this.makeCube('SpecularEnvSampler', dir =>
        loadImage(this.getTexUrl('papermill', 'specular', dir))
      );
    }

    return this._SpecularEnvSampler;
  }

  getBrdfTex() {
    if (!this._BrdfTex) {
      this._BrdfTex = new Texture2D(this.gl, {
        id: 'brdfLUT',
        parameters: {
          //
        },
        pixelStore: {
          [this.gl.UNPACK_FLIP_Y_WEBGL]: false
        },
        // Texture2D accepts a promise that returns an image as data (Async Textures)
        data: loadImage(this.getBrdfUrl())
      });
    }

    return this._BrdfTex;
  }
}

export default class GLTFMaterialParser {
  constructor(gl, {attributes, material, debug, ibl}) {
    this.gl = gl;

    this.defines = {
      USE_TEX_LOD: 1,

      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: 1,
      SRGB_FAST_APPROXIMATION: 1
    };

    this.uniforms = {
      // TODO: find better values?
      u_Camera: [0, 0, 0], // Model should override

      u_LightDirection: [0.0, 0.5, 0.5],
      u_LightColor: [1.0, 1.0, 1.0],

      u_MetallicRoughnessValues: [1, 1] // Default is 1 and 1
    };

    this.parameters = {};

    if (ibl) {
      this.env = new GLTFEnv(gl);
      // u_DiffuseEnvSampler: this.env.getDiffuseEnvSampler(),
      // u_SpecularEnvSampler: this.env.getSpecularEnvSampler(),
      this.uniforms.u_brdfLUT = this.env.getBrdfTex();
      this.uniforms.u_ScaleIBLAmbient = [1, 1];
    }

    if (debug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.uniforms.u_ScaleDiffBaseMR = [0, 0, 0, 0];
      this.uniforms.u_ScaleFGDSpec = [0, 0, 0, 0];
    }

    this.defineIfPresent(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIfPresent(attributes.TANGENT, 'HAS_TANGENTS');
    this.defineIfPresent(attributes.TEXCOORD_0, 'HAS_UV');

    this.defineIfPresent(ibl, 'USE_IBL');
    this.defineIfPresent(debug, 'PBR_DEBUG');

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

    const texture = new Texture2D(this.gl, {
      id: gltfTexture.name || gltfTexture.id,
      parameters,
      pixelStore: {
        [this.gl.UNPACK_FLIP_Y_WEBGL]: false
      },
      // Texture2D accepts a promise that returns an image as data (Async Textures)
      data: gltfTexture.texture.source.getImageAsync()
    });
    this.uniforms[name] = texture;
    this.defineIfPresent(define, define);
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
        blendEquation: this.gl.FUNC_ADD,
        blendFunc: [
          this.gl.SRC_ALPHA,
          this.gl.ONE_MINUS_SRC_ALPHA,
          this.gl.ONE,
          this.gl.ONE_MINUS_SRC_ALPHA
        ]
      });
    }
  }
}
