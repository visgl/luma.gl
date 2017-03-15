#ifdef GL_ES
precision highp float;
#endif
uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform sampler2D sampler1;
uniform float elevation;
varying vec2 vTexCoord;
uniform vec2 cursor;

#include "packing.glsl"

void main(void) {
  vec2 position = vTexCoord;
  float x = floor(position.x * RESOLUTIONX);
  float y = floor(position.y * RESOLUTIONY);
  float dist = distance(
    vec2(position.x * RESOLUTIONX, position.y * RESOLUTIONY), 
    vec2((cursor.x + 0.5) * RESOLUTIONX, (cursor.y + 0.5) * RESOLUTIONY)) * 0.6;
    
  float el = decode(texture2D(sampler1, position));
  el += elevation * exp(- dist * dist) / 10.;
  gl_FragColor = encode(el) ;
}