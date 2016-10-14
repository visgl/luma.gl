#ifdef GL_ES
precision highp float;
#endif

#define BLUR_LIMIT 10
#define BLUR_LIMIT_SQ 400.0

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vPosition;

uniform bool hasTexture1;
uniform sampler2D sampler1;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  float dx;
  float dy;

  if (hasTexture1) {
    //fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
    
    for (int i = - BLUR_LIMIT; i < BLUR_LIMIT; i++) {
      dx = float(i) / 1024.0;
      for (int j = - BLUR_LIMIT; j < BLUR_LIMIT; j++) {
        dy = float(j) / 1024.0;
        fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s + dx, vTexCoord1.t + dy)) / BLUR_LIMIT_SQ;
      }
    }
    
  }
  
  gl_FragColor = fragmentColor;
}
