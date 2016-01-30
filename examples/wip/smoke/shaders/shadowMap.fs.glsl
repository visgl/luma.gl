#ifdef GL_ES
precision highp float;
#endif

varying vec3 position;
varying vec4 color;

void main() {
  gl_FragColor = vec4(0, 0, color.z, 1);
}