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
    lightSourceUniforms['lighting_uAmbientLight.color'] = ambientLight.color;
    lightSourceUniforms['lighting_uAmbientLight.intensity'] = ambientLight.intensity;
  }

  let index = 0;
  for (const i in pointLights) {
    const pointLight = pointLights[i];
    lightSourceUniforms[`lighting_uPointLight[${index}].color`] = pointLight.color;
    lightSourceUniforms[`lighting_uPointLight[${index}].intensity`] = pointLight.intensity;
    lightSourceUniforms[`lighting_uPointLight[${index}].position`] = pointLight.position;
    index++;
  }
  lightSourceUniforms.lighting_uPointLightCount = pointLights.length;

  index = 0;
  for (const i in directionalLights) {
    const directionalLight = directionalLights[i];
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].color`] = directionalLight.color;
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].intensity`] =
      directionalLight.intensity;
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].direction`] =
      directionalLight.direction;
    index++;
  }
  lightSourceUniforms.lighting_uDirectionalLightCount = directionalLights.length;

  return lightSourceUniforms;
}

function getMaterialUniforms(material) {
  const materialUniforms = {};
  materialUniforms.lighting_uAmbient = material.ambient;
  materialUniforms.lighting_uDiffuse = material.diffuse;
  materialUniforms.lighting_uShininess = material.shininess;
  materialUniforms.lighting_uSpecularColor = material.specularColor;
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
    return {};
  }

  const lightUniforms = Object.assign(
    {},
    getLightSourceUniforms({ambientLight, pointLights, directionalLights}),
    getMaterialUniforms(material),
    {lighting_uEnabled: true}
  );

  return lightUniforms;
}
