#ifdef GL_ES
precision highp float;
#endif

uniform vec3 pointColor;

varying vec3 vPosition;
varying float opacity;

void main() {
  /*if (opacity <= 0.0) discard;*/
  /*gl_FragColor = vec4( pointColor + vPosition * 0.005, opacity );*/
  gl_FragColor = vec4(1, 0, 0, 1) * 1. / (sqrt(opacity));
}
