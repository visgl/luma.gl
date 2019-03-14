import lightingShader from './lighting.glsl';

export default {
  name: 'lighting',
  vs: lightingShader,
  fs: lightingShader,
  getUniforms,
  defines: {
    MAX_LIGHTS: 3
  }
};

const INITIAL_MODULE_OPTIONS = {};

// Take color 0-255 and intensity as input and output 0.0-1.0 range
function convertColor({color = [0, 0, 0], intensity = 1.0} = {}) {
  return color.map(component => (component * intensity) / 255.0);
}

function getLightSourceUniforms({ambientLight, pointLights = [], directionalLights = []}) {
  const lightSourceUniforms = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_uAmbientLight.color'] = convertColor(ambientLight);
  } else {
    lightSourceUniforms['lighting_uAmbientLight.color'] = [0, 0, 0];
  }

  pointLights.forEach((pointLight, index) => {
    lightSourceUniforms[`lighting_uPointLight[${index}].color`] = convertColor(pointLight);
    lightSourceUniforms[`lighting_uPointLight[${index}].position`] = pointLight.position;
    lightSourceUniforms[`lighting_uPointLight[${index}].attenuation`] = pointLight.attenuation;
  });
  lightSourceUniforms.lighting_uPointLightCount = pointLights.length;

  directionalLights.forEach((directionalLight, index) => {
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].color`] = convertColor(
      directionalLight
    );
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].direction`] =
      directionalLight.direction;
  });
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

  return Object.assign({}, getLightSourceUniforms({ambientLight, pointLights, directionalLights}), {
    lighting_uEnabled: true
  });
}
