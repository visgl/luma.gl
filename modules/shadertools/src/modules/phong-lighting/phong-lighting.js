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

const DEFAULT_MATERIAL_PROPERTIES = {
  ambient: 0.35,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [30, 30, 30]
};

const INITIAL_MODULE_OPTIONS = {};

function getMaterialUniforms(material) {
  const materialUniforms = {};
  materialUniforms.lighting_uAmbient = material.ambient;
  materialUniforms.lighting_uDiffuse = material.diffuse;
  materialUniforms.lighting_uShininess = material.shininess;
  materialUniforms.lighting_uSpecularColor = material.specularColor.map(x => x / 255);
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

  return getMaterialUniforms(Object.assign({}, DEFAULT_MATERIAL_PROPERTIES, material));
}

export {gouraudLighting, phongLighting};
