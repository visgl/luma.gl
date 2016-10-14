#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;
varying vec2 vTexCoord;

#include "3d.glsl"

void main() {
  float x = vTexCoord.x;
  float y = floor(vTexCoord.y * FIELD_RESO) / FIELD_RESO;
  float z = mod(vTexCoord.y * FIELD_RESO * FIELD_RESO, FIELD_RESO) / FIELD_RESO;

  vec3 Dx = dx(sampler1,x,y,z);
  vec3 Dy = dy(sampler1,x,y,z);
  vec3 Dz = dz(sampler1,x,y,z);
  gl_FragColor = vec4(Dx.x, Dy.y, Dz.z,1);
}