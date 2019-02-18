import {pbr} from '@luma.gl/shadertools';
import {Texture2D, TextureCube} from '../../webgl';
import {loadImage} from '../../io/browser-load';
import Model from '../model';
import log from '../../utils/log';
import {isWebGL2} from '../../webgl';

const vs = `
#if (__VERSION__ < 300)
  #define _attr attribute
#else
  #define _attr in
#endif

  _attr vec4 POSITION;

  #ifdef HAS_NORMALS
    _attr vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    _attr vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    _attr vec2 TEXCOORD_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = NORMAL;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = TEXCOORD_0;
    #endif

    pbr_setPositionNormalTangentUV(POSITION, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = u_MVPMatrix * POSITION;
  }
`;

const fs = `
#if (__VERSION__ < 300)
  #define fragmentColor gl_FragColor
#else
  out vec4 fragmentColor;
#endif

  void main(void) {
    fragmentColor = pbr_filterColor(vec4(0));
  }
`;

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

class GLTFMaterialParser {
  constructor(gl, {attributes, material, debug}) {
    this.gl = gl;
    this.env = new GLTFEnv(gl);

    this.defines = {
      USE_IBL: 1,
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

      u_MetallicRoughnessValues: [1, 1], // Default is 1 and 1

      // IBL
      // u_DiffuseEnvSampler: this.env.getDiffuseEnvSampler(),
      // u_SpecularEnvSampler: this.env.getSpecularEnvSampler(),
      u_brdfLUT: this.env.getBrdfTex(),
      u_ScaleIBLAmbient: [1, 1]
    };

    if (debug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.uniforms.u_ScaleDiffBaseMR = [0, 0, 0, 0];
      this.uniforms.u_ScaleFGDSpec = [0, 0, 0, 0];
    }

    this.defineIfPresent(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIfPresent(attributes.TANGENT, 'HAS_TANGENTS');
    this.defineIfPresent(attributes.TEXCOORD_0, 'HAS_UV');

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
  }
}

function addVersionToShader(gl, source) {
  if (isWebGL2(gl)) {
    return `#version 300 es\n${source}`;
  }

  return source;
}

export function createGLTFModel(
  gl,
  {id, drawMode, vertexCount, attributes, material, modelOptions, debug = false}
) {
  const materialParser = new GLTFMaterialParser(gl, {attributes, material, debug});

  log.info(4, 'createGLTFModel defines: ', materialParser.defines)();

  const model = new Model(
    gl,
    Object.assign(
      {
        id,
        drawMode,
        vertexCount,
        modules: [pbr],
        defines: materialParser.defines,
        vs: addVersionToShader(gl, vs),
        fs: addVersionToShader(gl, fs)
      },
      modelOptions
    )
  );

  model.setProps({attributes});
  model.setUniforms(materialParser.uniforms);

  materialParser.env.getDiffuseEnvSampler().then(cubeTex => {
    model.setUniforms({
      u_DiffuseEnvSampler: cubeTex
    });
  });

  materialParser.env.getSpecularEnvSampler().then(cubeTex => {
    model.setUniforms({
      u_SpecularEnvSampler: cubeTex
    });
  });

  return model;
}
