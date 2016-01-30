#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;
varying vec2 vTexCoord;

void main() {
  gl_FragColor = vec4(clamp(vec3(texture2D(sampler1, vTexCoord).z),0.,1.),1);
}