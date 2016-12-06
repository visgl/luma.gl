#define SHADER_NAME luma-frag-lighting-vs

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord1;
attribute vec2 texCoord2;
attribute vec2 texCoord3;
attribute vec4 color;

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;

void main(void) {
  lighting_setPositionAndNormal(positions, normals);

  vTexCoord1 = texCoord1;
  vTexCoord2 = texCoord2;
  vTexCoord3 = texCoord3;
  vColor = color;

  gl_Position = projectionMatrix * vPosition;
}

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

