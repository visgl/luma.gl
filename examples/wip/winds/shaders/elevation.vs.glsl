attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying vec2 vTexCoord;

void main(void) {
  vec4 pos = vec4(position, 1.);
  gl_Position = projectionMatrix * worldMatrix * pos;
  vTexCoord = texCoord1;
}
