attribute vec3 position;
varying vec4 vPosition;
uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

void main(void) {
  vPosition = vec4(position, 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}
