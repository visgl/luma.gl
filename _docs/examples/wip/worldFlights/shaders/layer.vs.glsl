attribute vec3 position;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

uniform vec4 colorUfm;
varying vec4 vColor;

void main(void) {
  vColor = colorUfm;
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);
}
