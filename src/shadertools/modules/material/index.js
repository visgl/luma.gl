/* eslint-disable camelcase */
export function getUniforms({
  enable = true,

  // Color that is emitted without any light
  materialEmissiveColor,

  // Color that is emitted when illuminated by ambient light
  materialAmbientColor,

  materialDiffuseColor,
  materialDiffuseMapEnable,
  materialDiffuseMap,

  materialSpecularity,
  materialSpecularMapEnable,
  materialSpecularMap,

  materialEnableEnvironment,
  materialEnvironmentMapEnable,
  materialEnvironmentMap,
  materialEnvironmentColor,
  materialEnvironmentReflection,
  materialEnvirinmentRefraction
} = {}) {
  return {
    material_uAmbientColor: materialAmbientColor,
    material_uDiffuseColor: materialDiffuseColor
    // material_uSpecularColor: materialSpecularColor,
    // material_uEmissiveColor: materialEmissiveColor,

    // material_uReflection: materialReflection,
    // material_uRefraction: materialRefraction,

    // material_enableDiffuseMap: materialnableDiffuseMap,
    // material_enableSpecularMap: materialnableSpecularMap,
    // material_enableEnvironmentMap: materialnableEnvironmentMap,

    // material_diffuseMap: materialiffuseMap,
    // material_specularMap: materialpecularMap,
    // material_environmentMap: materialnvironmentMap,
  };
}

export const vs = `\
/* Set the UV coordinate from attributes */
void material_setUVs(diffuseUV, specularUV) {
  material_vDiffuseUV = diffuseUV;
  material_vSpecularUV = specularUV;
}
`;

export const fs = `\
uniform vec3 material_uAmbientColor;
uniform vec3 material_uDiffuseColor;
uniform vec3 material_uSpecularColor;
uniform vec3 material_uEmissiveColor;

// reflection / refraction configs
uniform float material_uReflection;
uniform float material_uRefraction;

uniform bool material_enableDiffuseMap;
uniform bool material_enableSpecularMap;
uniform bool material_enableEnvironmentMap;

uniform sampler2D material_diffuseMap;
uniform sampler2D material_specularMap;
uniform samplerCube material_environmentMap;

varying vec2 material_vDiffuseTextureCoordinate;
varying vec2 material_vSpecularTextureCoordinate;

// MATERIAL ATTRIBUTE ACCESSORS

// Gets diffuse color of material from uniform or specular map, if supplied and enabled
// If we have a standard (diffuse) texture, set color to texture
float material_getDiffuseColor() {

}

// Gets shininess of material from uniform or specular map, if supplied and enabled
float material_getShininess() {
  float shininess = material_uShininess;
  if (material_enableSpecularMap) {
    vec2 texCoords = material_vDiffuseSpecularTextureCoordinate;
    shininess = texture2D(sampler2, vec2(vTexCoord1.s, vTexCoord1.t)).r * 255.0;
  }

  if (shininessVal > 255.0) {
    shininessVal = shininess;
  }

  return shininess;
}

// Environment map - cube texture
vec4 material_filterColor_environmentMap(color)
  if (material_enableEnvironmentMap) {
    vec3 nReflection = normalize(material_vReflection);
    vec3 reflectionValue;
    if (material_uRefraction > 0.0) {
     reflectionValue = refract(nReflection, material_vNormal, material_uRefraction);
    } else {
     reflectionValue = -reflect(nReflection, material_vNormal);
    }

    vec4 cubeColor = textureCube(material_uEnvironmentMap,
      vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));
    color = vec4(mix(color.rgb, cubeColor.rgb, reflection), color.a);
  }
  return color;
}

// COLOR FILTERING

// Gets shininess of material from uniform or specular map, if supplied and enabled
// If we have a standard (diffuse) texture, set color to texture
vec4 material_filterColor_diffuseMap(vec4 color) {
  if (material_enableDiffuseTexture) {
    color = texture2D(material_uDiffuseTexture, material_vDiffuseTextureCoordinate);
  }
  return color;
}

vec4 material_filterColor(vec4 color) {
  color = material_filterColor_diffuseMap(color);
  color = material_filterColor_environmentMap(color);
  return color;
}
`;
