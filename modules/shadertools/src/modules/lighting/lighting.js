import lightingShader from './lighting.glsl';

export default {
  name: 'lighting',
  fs: lightingShader,
  getUniforms,
  defines: {
    MAX_LIGHTS: 3
  }
};

const INITIAL_MODULE_OPTIONS = {};

function getLightSourceUniforms({ambientLight, pointLights = [], directionalLights = []}) {
  const lightSourceUniforms = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_uAmbientLight.color'] = ambientLight.color;
    lightSourceUniforms['lighting_uAmbientLight.intensity'] = ambientLight.intensity;
  } else {
    lightSourceUniforms['lighting_uAmbientLight.color'] = [0, 0, 0];
    lightSourceUniforms['lighting_uAmbientLight.intensity'] = 0.0;
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

function getUniforms(opts = INITIAL_MODULE_OPTIONS) {
  if (!('lightSources' in opts)) {
    return {};
  }

  const {ambientLight, pointLights, directionalLights} = opts.lightSources;
  const hasLights =
    ambientLight ||
    (pointLights && pointLights.length > 0) ||
    (directionalLights && directionalLights.length > 0);

  if (!hasLights) {
    return {lighting_uEnabled: false};
  }

  const lightUniforms = Object.assign(
    {},
    getLightSourceUniforms({ambientLight, pointLights, directionalLights}),
    {lighting_uEnabled: true}
  );

  return lightUniforms;
}
