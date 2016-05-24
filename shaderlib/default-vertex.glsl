#define SHADER_NAME luma-default-vertex

#define LIGHT_MAX 4

// object attributes
attribute vec3 positions;
attribute vec3 normals;
attribute vec4 colors;
attribute vec4 pickingColors;
attribute vec2 texCoords;

// camera and object matrices
uniform mat4 viewMatrix;
uniform mat4 viewInverseMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

// objectMatrix * viewMatrix = worldMatrix
uniform mat4 worldMatrix;
uniform mat4 worldInverseMatrix;
uniform mat4 worldInverseTransposeMatrix;
uniform mat4 objectMatrix;
uniform vec3 cameraPosition;

// lighting configuration
uniform bool enableLights;
uniform vec3 ambientColor;
uniform vec3 directionalColor;
uniform vec3 lightingDirection;

// point lights configuration
uniform vec3 pointLocation[LIGHT_MAX];
uniform vec3 pointColor[LIGHT_MAX];
uniform int numberPoints;

// reflection / refraction configuration
uniform bool useReflection;

// varyings
varying vec3 vReflection;
varying vec4 vColor;
varying vec4 vPickingColor;
varying vec2 vTexCoord;
varying vec4 vNormal;
varying vec3 lightWeighting;

void main(void) {
  vec4 mvPosition = worldMatrix * vec4(positions, 1.0);
  vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normals, 1.0);

  // lighting code
  if(!enableLights) {
    lightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    vec3 plightDirection;
    vec3 pointWeight = vec3(0.0, 0.0, 0.0);
    float directionalLightWeighting =
      max(dot(transformedNormal.xyz, lightingDirection), 0.0);
    for (int i = 0; i < LIGHT_MAX; i++) {
      if (i < numberPoints) {
        plightDirection = normalize(
          (viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);
         pointWeight += max(
          dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];
       } else {
         break;
       }
     }

    lightWeighting = ambientColor +
      (directionalColor * directionalLightWeighting) + pointWeight;
  }

  // refraction / reflection code
  if (useReflection) {
    vReflection =
      (viewInverseMatrix[3] - (worldMatrix * vec4(positions, 1.0))).xyz;
  } else {
    vReflection = vec3(1.0, 1.0, 1.0);
  }

  // pass results to varyings
  vColor = colors;
  vPickingColor = pickingColors;
  vTexCoord = texCoords;
  vNormal = transformedNormal;
  gl_Position = projectionMatrix * worldMatrix * vec4(positions, 1.0);
}
