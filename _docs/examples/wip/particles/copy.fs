#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;
varying vec2 vTexCoord1;

void main() {
  gl_FragColor = texture2D(sampler1, vTexCoord1);
}



