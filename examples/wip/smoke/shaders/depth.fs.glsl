#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2;
uniform float time;
varying vec2 vTexCoord;

void main() {
  vec3 pos = texture2D(sampler2, vTexCoord).xyz;
  
}