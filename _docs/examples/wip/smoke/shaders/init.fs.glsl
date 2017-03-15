#ifdef GL_ES
precision highp float;
#endif


uniform float time;
uniform float multiple, curr;
uniform sampler2D sampler1;
varying vec2 vTexCoord;

#include "rng.glsl"

void main() {
  float idx = (vTexCoord.x * 256. + vTexCoord.y) * 256. + curr * 256. * 256.;
  float f = ceil(pow(multiple * 256. * 256., 1. / 3.));
  vec3 position = vec3(mod(idx / f / f, f) / f, mod(idx / f, f) / f, mod(idx, f) / f);
  gl_FragColor = vec4(
    normalize(position - 0.5) * 0.01 + 0.5, 
  cross(noise(position), position).x);
}