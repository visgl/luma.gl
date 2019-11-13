import lights from '../lights/lights';
import lightingShader from './phong-lighting.glsl';

const gouraudLighting = {
  name: 'gouraud-lighting',
  dependencies: [lights],
  vs: lightingShader,
  defines: {
    LIGHTING_VERTEX: 1
  },
  getUniforms
};

const phongLighting = {
  name: 'phong-lighting',
  dependencies: [lights],
  fs: lightingShader,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  getUniforms
};

const INITIAL_MODULE_OPTIONS = {};

function getMaterialUniforms(material) {
  const {ambient = 0.35, diffuse = 0.6, shininess = 32, specularColor = [30, 30, 30]} = material;

  return {
    lighting_uAmbient: ambient,
    lighting_uDiffuse: diffuse,
    lighting_uShininess: shininess,
    lighting_uSpecularColor: specularColor.map(x => x / 255)
  };
}

function getUniforms(opts = INITIAL_MODULE_OPTIONS) {
  if (!('material' in opts)) {
    return {};
  }

  const {material} = opts;

  if (!material) {
    return {lighting_uEnabled: false};
  }

  return getMaterialUniforms(material);
}

export {gouraudLighting, phongLighting};
