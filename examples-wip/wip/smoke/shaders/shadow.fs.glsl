#ifdef GL_ES
precision highp float;
#endif

varying vec3 position;
varying vec4 color;

void main() {
  gl_FragColor = color;
  gl_FragColor.a *= clamp(1. - length(gl_PointCoord - 0.5) * 2., 0., 1.) * 0.3;
}