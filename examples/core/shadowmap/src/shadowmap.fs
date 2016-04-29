#ifdef GL_ES
precision highp float;
#endif

void main(void) {
  gl_FragColor = vec4(0,0,gl_FragCoord.z,1);
}
