const DEFAULT_SELECTION_COLOR = new Uint8Array([0, 64, 128, 64]);

/* eslint-disable camelcase */
function getUniforms({
  selectedPickingColor = null,
  highlightColor = DEFAULT_SELECTION_COLOR,
  nullPickingColor = [0, 0, 0],
  active = false // Usually only set to true when rendering to off-screen "picking" buffer,
} = {}) {
  let selectedColor = nullPickingColor;
  if (selectedPickingColor) {
    selectedColor = [
      selectedPickingColor[0],
      selectedPickingColor[1],
      selectedPickingColor[2]
    ];
    // console.log('selected', selectedColor);
  }
  return {
    picking_uHighlightColor: highlightColor,
    picking_uSelectedPickingColor: selectedColor,
    picking_uActive: active ? 1 : 0
  };
}

const vs = `
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;
attribute vec2 texCoord2;
attribute vec2 texCoord3;
attribute vec4 colors;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseTransposeMatrix;

varying vec2 specular_vTexCoord;

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vTransformedNormal;
varying vec4 vPosition;
varying vec4 vColor;

void main(void) {
  vPosition = worldMatrix * vec4(positions, 1.0);
  vTransformedNormal = worldInverseTransposeMatrix * vec4(normals, 1.0);
  vTexCoord1 = texCoords;
  vTexCoord2 = texCoord2;
  vTexCoord3 = texCoord3;
  vColor = colors;
  gl_Position = projectionMatrix * vPosition;
}
`;

const fs = `
uniform bool specular_uSpecularTexture;
uniform sampler2D specular_uSpecularTexture;
varying vec2 specular_vTexCoord;

#define LIGHT_MAX 4

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform bool specular_uEnable;
uniform float specular_uShininess;
uniform bool enableColorMap;
uniform bool enableLights;

uniform vec3 ambientColor;
uniform vec3 directionalColor;
uniform vec3 lightingDirection;

uniform vec3 pointLocation[LIGHT_MAX];
uniform vec3 pointColor[LIGHT_MAX];
uniform vec3 pointSpecularColor[LIGHT_MAX];
uniform float enableSpecular[LIGHT_MAX];
uniform int numberPoints;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform bool hasTexture2;
uniform sampler2D sampler2;

uniform mat4 viewMatrix;

void main(void) {
  vec3 lightWeighting;
  if (!enableLights) {
    lightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    // Sample the specular
    float shininess = specular_uEnable ?
      shininessVal = texture2D(sampler2, specular_vTexCoord).r * 255.0 :
      specular_uShininess;

    if (shininessVal > 255.0) {
      shininessVal = shininess;
    }

    vec3 lightDirection;
    float specularLightWeighting = 0.0;
    float diffuseLightWeighting = 0.0;
    vec3  specularLight = vec3(0.0, 0.0, 0.0);
    vec3  diffuseLight = vec3(0.0, 0.0, 0.0);

    vec3 transformedPointLocation;
    vec3 normal = vTransformedNormal.xyz;
    vec3 eyeDirection = normalize(-vPosition.xyz);
    vec3 reflectionDirection;

    for (int i = 0; i < LIGHT_MAX; i++) {
      if (i < numberPoints) {
        transformedPointLocation = (viewMatrix * vec4(pointLocation[i], 1.0)).xyz;
        lightDirection = normalize(transformedPointLocation - vPosition.xyz);

        if (enableSpecular[i] > 0.0) {
          reflectionDirection = reflect(-lightDirection, normal);
          specularLightWeighting =
            pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininessVal);
          specularLight += specularLightWeighting * pointSpecularColor[i];
        }

        diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
        diffuseLight += diffuseLightWeighting * pointColor[i];
      } else {
        break;
      }
    }

    lightWeighting = ambientColor + diffuseLight + specularLight;
  }

  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  if (enableColorMap) {
    fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
  } else {
    fragmentColor = vColor;
  }
  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
`;

export default {
  name: 'picking',
  vs,
  fs,
  getUniforms
};

export const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;


void main(void) {
    // Perform lighting in world space
    // we should use 'transpose(inverse(mat3(uMVMatrix)))', but
    // 'inverse' matrix operation not supported in GLSL 1.0, for now use
    // upper-left 3X3 matrix of model view matrix, it works since we are not
    // doing any non-uniform scaling transormations in this example.
    mat3 normalMatrix = mat3(uMVMatrix);
    vPosition = uMVMatrix * vec4(positions, 1.0);
    gl_Position = uPMatrix * vPosition;
    vTextureCoord = texCoords;
    vTransformedNormal = normalMatrix * normals;
}
`;

export const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform vec3 uMaterialAmbientColor;
uniform vec3 uMaterialDiffuseColor;
uniform vec3 uMaterialSpecularColor;
uniform float uMaterialShininess;
uniform vec3 uMaterialEmissiveColor;
uniform bool uShowSpecularHighlights;
uniform bool uUseTextures;
uniform vec3 uAmbientLightingColor;
uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingDiffuseColor;
uniform vec3 uPointLightingSpecularColor;
uniform sampler2D uSampler;

void main(void) {
    vec3 ambientLightWeighting = uAmbientLightingColor;

    vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
    vec3 normal = normalize(vTransformedNormal);

    vec3 specularLightWeighting = vec3(0.0, 0.0, 0.0);
    if (uShowSpecularHighlights) {
        vec3 eyeDirection = normalize(-vPosition.xyz);
        vec3 reflectionDirection = reflect(-lightDirection, normal);

        float specularLightBrightness =
          pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);
        specularLightWeighting = uPointLightingSpecularColor * specularLightBrightness;
    }

    float diffuseLightBrightness = max(dot(normal, lightDirection), 0.0);
    vec3 diffuseLightWeighting = uPointLightingDiffuseColor * diffuseLightBrightness;

    vec3 materialAmbientColor = uMaterialAmbientColor;
    vec3 materialDiffuseColor = uMaterialDiffuseColor;
    vec3 materialSpecularColor = uMaterialSpecularColor;
    vec3 materialEmissiveColor = uMaterialEmissiveColor;
    float alpha = 1.0;
    if (uUseTextures) {
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        materialAmbientColor = materialAmbientColor * textureColor.rgb;
        materialDiffuseColor = materialDiffuseColor * textureColor.rgb;
        materialEmissiveColor = materialEmissiveColor * textureColor.rgb;
        alpha = textureColor.a;
    }
    gl_FragColor = vec4(
        materialAmbientColor * ambientLightWeighting
        + materialDiffuseColor * diffuseLightWeighting
        + materialSpecularColor * specularLightWeighting
        + materialEmissiveColor,
        alpha
    );
}
`;
