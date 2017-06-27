// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-disable camelcase */
const getUniforms = ({
  enable,
  cameraPosition,
  numberOfLights = 2,
  lightPosition = [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
  lightStrength = [0.8, 0.0, 0.8, 0.0],
  ambientRatio = 0.4,
  diffuseRatio = 0.6,
  specularRatio = 0.2
}) => ({
  lighting_uEnable: enable,
  lighting_uCameraPosition: cameraPosition,
  lighting_uNumberOfLights: 2,
  lighting_uLightPositionWorld: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
  lighting_lightStrength: [0.8, 0.0, 0.8, 0.0],
  lighting_uAmbientRatio: 0.4,
  lighting_uDiffuseRatio: 0.6,
  lighting_uSpecularRatio: 0.2
});

const vs = `\
#define NUM_OF_LIGHTS 2
uniform bool lighting_uEnable;
uniform vec3 lighting_uCameraPositionWorld;
uniform float lighting_uNumberOfLights;
uniform vec3 lighting_uLightPositionWorld[4];
uniform vec2 lighting_lightStrength[4];
uniform float lighting_uAmbientRatio;
uniform float lighting_uDiffuseRatio;
uniform float lighting_uSpecularRatio;

float lighting_getLightWeight(vec3 positionWorld, vec3 normalWorld) {
  float lightWeight = 0.0;
  vec3 normalWorld = normalWorld.xzy;
  vec3 viewDirection = normalize(lighting_uCameraPositionWorld - positionWorld);

  for (int i = 0; i < NUM_OF_LIGHTS; i++) {
    vec3 lightPositionWorld = lighting_uLightPositionWorld[i]);
    vec3 lightDirection = normalize(lightPositionWorld - positionWorld);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);

    float lambertian = dot(lightDirection, normalWorld);
    float specular = 0.0;
    if (lambertian > 0.0) {
      float specular_angle = max(dot(normalWorldspace_vec3, halfwayDirection), 0.0);
      specular = pow(specular_angle, 32.0);
    }
    lambertian = max(lambertian, 0.0);
    lightWeight += lighting_lightStrength[i].x * (
      lighting_uAmbientRatio +
      lighting_uDiffuseRatio * lambertian +
      lighting_uSpecularRatio * specular
    );
  }

  return lightWeight;
}

vec4 lighting_world_filterColor(vec3 color, vec3 positionWorld, vec3 normalWorld) {
  return vec4(color.rgb * getLightWeight(positionWorld, normalWorld))
}

vec4 lighting_world_filterColor(vec4 color) {
  return vec4(color.rgb * getLightWeight(world.position, world.normal))
}
`;

/*
const fs = `\
uniform bool specular_uEnabled;
uniform bool specular_uDefaultShininess;
uniform sampler2D specular_uSpecularTexture;
float specularity_getShininess(vec2 texCoord) {
  float shininess = specular_uEnable ?
    shininessVal = texture2D(sampler2, texCoord).r * 255.0 :
    specular_uDefaultShininess;
  return shininess;
}
vec4 lighting_world_filterColor(color, positionWorld, normalWorld, shininess) {
  return vec4(color.rgb * getLightWeight)
}
`;
*/

export default {
  name: 'lighting-deck',
  vs,
  fs: null,
  getUniforms,
  dependencies: ['project', 'material']
};
