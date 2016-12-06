#define SHADER_NAME spec-map-vs

attribute vec3 positions;
attribute vec3 normals;
attribute vec4 colors;
attribute vec2 texCoords;

uniform mat4 projectionMatrix;

varying vec2 vTexCoord1;
varying vec4 vColor;

void main(void) {
  lighting_setPositionAndNormal(positions, normals);

  vTexCoord1 = texCoords;
  vColor = colors;

  gl_Position = projectionMatrix * vPosition;
}

