import lighting from '../lighting/lighting';
import lightingShader from './phong-lighting.glsl';

export default {
  name: 'phong-lighting',
  dependencies: [lighting],
  vs: lightingShader,
  defines: {
    LIGHTING_VERTEX: 1
  },
  getUniforms
};

const INITIAL_MODULE_OPTIONS = {};

function getMaterialUniforms(material) {
  const materialUniforms = {};
  materialUniforms.lighting_uAmbient = material.ambient;
  materialUniforms.lighting_uDiffuse = material.diffuse;
  materialUniforms.lighting_uShininess = material.shininess;
  materialUniforms.lighting_uSpecularColor = material.specularColor;
  return materialUniforms;
}

function getUniforms(opts = INITIAL_MODULE_OPTIONS) {
  if (!('material' in opts)) {
    return {};
  }

  const {material} = opts;

  if (!material) {
    return {lighting_uEnabled: false};
  }

  return Object.assign({}, getMaterialUniforms(material), {lighting_uEnabled: true});
}
