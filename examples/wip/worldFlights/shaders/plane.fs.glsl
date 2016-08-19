#ifdef GL_ES
precision highp float;
#endif

#define BLUR_LIMIT 10
#define BLUR_LIMIT_SQ float(2 * 4 * BLUR_LIMIT) 

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform float width;
uniform float height;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  float dx;
  float dy;
  float ndx;
  float ndy;

  if (hasTexture1) {
    //fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
    for (int i = - BLUR_LIMIT; i < BLUR_LIMIT; i++) {
      dx = float(i) / width;
      dy = float(i) / height;
      ndx = - dx;
      ndy = - dy;
      fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s +  dx, vTexCoord1.t +  dy)) / BLUR_LIMIT_SQ;
      fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s + ndx, vTexCoord1.t + ndy)) / BLUR_LIMIT_SQ;
      fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s +  dx, vTexCoord1.t + ndy)) / BLUR_LIMIT_SQ;
      fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s + ndx, vTexCoord1.t +  dy)) / BLUR_LIMIT_SQ;
    }
  }
  
  gl_FragColor = fragmentColor;
}
