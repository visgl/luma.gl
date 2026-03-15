// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const lightingUniformsWGSL = /* wgsl */ `\
// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
const MAX_LIGHTS: i32 = 5;

struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct lightingUniforms {
  enabled: i32,
  lightType: i32,

  directionalLightCount: i32,
  pointLightCount: i32,

  ambientColor: vec3<f32>,

  lightColor0: vec3<f32>,
  lightPosition0: vec3<f32>,
  lightDirection0: vec3<f32>,
  lightAttenuation0: vec3<f32>,

  lightColor1: vec3<f32>,
  lightPosition1: vec3<f32>,
  lightDirection1: vec3<f32>,
  lightAttenuation1: vec3<f32>,

  lightColor2: vec3<f32>,
  lightPosition2: vec3<f32>,
  lightDirection2: vec3<f32>,
  lightAttenuation2: vec3<f32>,

  lightColor3: vec3<f32>,
  lightPosition3: vec3<f32>,
  lightDirection3: vec3<f32>,
  lightAttenuation3: vec3<f32>,

  lightColor4: vec3<f32>,
  lightPosition4: vec3<f32>,
  lightDirection4: vec3<f32>,
  lightAttenuation4: vec3<f32>,
};

// Binding 0:1 is reserved for lighting (Note: could go into separate bind group as it is stable across draw calls)
@binding(1) @group(0) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  switch (index) {
    case 0: {
      return PointLight(lighting.lightColor0, lighting.lightPosition0, lighting.lightAttenuation0);
    }
    case 1: {
      return PointLight(lighting.lightColor1, lighting.lightPosition1, lighting.lightAttenuation1);
    }
    case 2: {
      return PointLight(lighting.lightColor2, lighting.lightPosition2, lighting.lightAttenuation2);
    }
    case 3: {
      return PointLight(lighting.lightColor3, lighting.lightPosition3, lighting.lightAttenuation3);
    }
    case 4, default: {
      return PointLight(lighting.lightColor4, lighting.lightPosition4, lighting.lightAttenuation4);
    }
  }
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  switch (index) {
    case 0: {
      return DirectionalLight(lighting.lightColor0, lighting.lightDirection0);
    }
    case 1: {
      return DirectionalLight(lighting.lightColor1, lighting.lightDirection1);
    }
    case 2: {
      return DirectionalLight(lighting.lightColor2, lighting.lightDirection2);
    }
    case 3: {
      return DirectionalLight(lighting.lightColor3, lighting.lightDirection3);
    }
    case 4, default: {
      return DirectionalLight(lighting.lightColor4, lighting.lightDirection4);
    }
  }
} 

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}
`;
