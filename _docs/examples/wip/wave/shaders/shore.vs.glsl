attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord1;

varying vec2 vTexCoord;
varying vec4 vPosition;
varying vec4 vNormal;

uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

void main(void) {
  vTexCoord = texCoord1;
  vPosition = vec4(position, 1);
  vNormal = vec4(normal, 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}
