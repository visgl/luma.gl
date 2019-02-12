import {pbr} from '@luma.gl/shadertools';
import {Texture2D} from '../../webgl';
import Model from '../model';
import log from '../../utils/log';

const vs = `
  attribute vec4 POSITION;

  #ifdef HAS_NORMALS
    attribute vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    attribute vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    attribute vec2 TEXCOORD_0;
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
  void main(void) {
    gl_FragColor = pbr_filterColor(gl_FragColor);
  }
`;

class GLTFMaterialParser {
  constructor(gl, {attributes, material}) {
    this.gl = gl;
    this.defines = {};
    this.uniforms = {
      // TODO: find better values?
      u_Camera: [0.0, 0.0, -4.0],
      u_LightDirection: [0.0, 0.5, 0.5],
      u_LightColor: [1.0, 1.0, 1.0],

      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      u_ScaleDiffBaseMR: [0, 0, 0, 0],
      u_ScaleFGDSpec: [0, 0, 0, 0],

      u_MetallicRoughnessValues: [1, 1] // Default is 1 and 1
    };

    this.defineIfPresent(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIfPresent(attributes.TANGENT, 'HAS_TANGENTS');
    this.defineIfPresent(attributes.TEXCOORD_0, 'HAS_UV');

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

export function createGLTFModel(gl, {id, drawMode, vertexCount, attributes, material}) {
  const materialParser = new GLTFMaterialParser(gl, {attributes, material});

  log.info(4, 'createGLTFModel defines: ', materialParser.defines)();

  const model = new Model(gl, {
    id,
    drawMode,
    vertexCount,
    modules: [pbr],
    defines: materialParser.defines,
    vs,
    fs
  });

  model.setProps({attributes});
  model.setUniforms(materialParser.uniforms);

  return model;
}
