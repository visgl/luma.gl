import lightingShader from './phong-lighting.glsl';

export default {
  name: 'lighting',
  vs: lightingShader,
  getUniforms
};

const INITIAL_MODULE_OPTIONS = {};

function getLightSourceUniforms({ambientLight, pointLights, directionalLights}) {
  const lightSourceUniforms = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_ambientLight.color'] = ambientLight.color;
    lightSourceUniforms['lighting_ambientLight.intensity'] = ambientLight.intensity;
  }

  let index = 0;
  for (const i in pointLights) {
    const pointLight = pointLights[i];
    lightSourceUniforms[`lighting_pointLight[${index}].color`] = pointLight.color;
    lightSourceUniforms[`lighting_pointLight[${index}].intensity`] = pointLight.intensity;
    lightSourceUniforms[`lighting_pointLight[${index}].position`] = pointLight.position;
    index++;
  }
  lightSourceUniforms.lighting_pointLightCount = pointLights.length;

  index = 0;
  for (const i in directionalLights) {
    const directionalLight = directionalLights[i];
    lightSourceUniforms[`lighting_directionalLight[${index}].color`] = directionalLight.color;
    lightSourceUniforms[`lighting_directionalLight[${index}].intensity`] =
      directionalLight.intensity;
    lightSourceUniforms[`lighting_directionalLight[${index}].direction`] =
      directionalLight.direction;
    index++;
  }
  lightSourceUniforms.lighting_directionalLightCount = directionalLights.length;

  return lightSourceUniforms;
}

function getMaterialUniforms(material) {
  const materialUniforms = {};
  materialUniforms.lighting_ambient = material.ambient;
  materialUniforms.lighting_diffuse = material.diffuse;
  materialUniforms.lighting_shininess = material.shininess;
  materialUniforms.lighting_specularColor = material.specularColor;
  return materialUniforms;
}

function getUniforms(opts = INITIAL_MODULE_OPTIONS) {
  const {
    ambientLight,
    pointLights,
    directionalLights,
    material
  } = opts;

  if (!(ambientLight || pointLights || directionalLights) || !material) {
    return {lighting_enabled: false};
  }

  const lightUniforms = Object.assign(
    {},
    getLightSourceUniforms({ambientLight, pointLights, directionalLights}),
    getMaterialUniforms(material),
    {lighting_enabled: true}
  );

  return lightUniforms;
}
