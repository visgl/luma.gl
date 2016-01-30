//projection matrix
uniform mat4 projectionMatrix;
//plane position
attribute vec3 position;
attribute vec4 color;
//ray direction
varying vec3 rD;
varying vec4 vColor;

void main(void) {
  rD = (projectionMatrix * vec4(position, 1.0)).xyz;
  gl_Position = vec4(position, 1.0);
  vColor = color;
}
