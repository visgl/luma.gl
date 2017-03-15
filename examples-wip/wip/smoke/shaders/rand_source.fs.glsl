#ifdef GL_ES
precision highp float;
#endif

uniform float FIELD_RESO;
uniform float seed, time;
varying vec2 vTexCoord;
#define PI 3.14159265359

#include "rng.glsl"
void main() {
  float x = vTexCoord.x;
  float y = floor(vTexCoord.y * FIELD_RESO) / FIELD_RESO;
  float z = mod(vTexCoord.y * FIELD_RESO * FIELD_RESO, FIELD_RESO) / FIELD_RESO;
  vec3 v = noise(vec3(x-0.5,y-0.5,z-0.5 + time)) - 0.5;
  gl_FragColor = vec4(v * 0.1,1.);
}