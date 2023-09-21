// luma.gl, MIT license

import {glsl} from '../../../lib/glsl-utils/highlight';

export const lightingUniforms = glsl`\
#if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))

struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

uniform lightingUniforms {
  bool enabled;

  AmbientLight ambientLight;

  int pointLightCount;
  PointLight pointLight[MAX_LIGHTS];

  int directionalLightCount;
  DirectionalLight directionalLight[MAX_LIGHTS];
} lighting;

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

#endif
`;
