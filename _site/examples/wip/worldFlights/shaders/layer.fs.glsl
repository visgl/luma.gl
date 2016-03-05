#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;

void main(){
  gl_FragColor = vColor;
}

