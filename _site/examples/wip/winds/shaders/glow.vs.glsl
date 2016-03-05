attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying vec2 vTexCoord1;

void main(void) {
  vTexCoord1 = texCoord1;
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1);
}


