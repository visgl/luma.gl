#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2;
uniform float time, dt, curr;
uniform vec3 center;
varying vec2 vTexCoord;

#include "3d.glsl"
#include "rng.glsl"

void main() {
  vec4 samp = texture2D(sampler2, vTexCoord);
  vec3 position = samp.xyz;
  float life = samp.a;
  if (life < 0.) {
    life = noise(position + curr * 100.).x * 0.5 + .6;
    position = center + normalize(noise(position+vec3(vTexCoord, 342. + curr)) - 0.5) * 0.05;
  } else {
    life -= dt * 0.7;
  }
  gl_FragColor = vec4(position.xyz, life);
}