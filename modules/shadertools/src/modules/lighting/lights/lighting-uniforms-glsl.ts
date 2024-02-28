// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {glsl} from '../../../lib/glsl-utils/highlight';

export const lightingUniforms = glsl`\
precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
  int enabled;
  int pointLightCount;
  int directionalLightCount;

  vec3 ambientColor;

  int lightType;
  vec3 lightColor;
  vec3 lightDirection;
  vec3 lightPosition;
  vec3 lightAttenuation;

  // AmbientLight ambientLight;
  // PointLight pointLight[MAX_LIGHTS];
  // DirectionalLight directionalLight[MAX_LIGHTS];
} lighting;

PointLight lighting_getPointLight(int index) {
  return PointLight(lighting.lightColor, lighting.lightPosition, lighting.lightAttenuation);
}

DirectionalLight lighting_getDirectionalLight(int index) {
  return DirectionalLight(lighting.lightColor, lighting.lightDirection);
} 

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

// #endif
`;
