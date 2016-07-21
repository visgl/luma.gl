#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vPosition;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform bool hasTexture2;
uniform sampler2D sampler2;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  vec2 blurSize = vec2(0.002, 0.002);
  float dx;
  float dy;

  fragmentColor += texture2D(sampler1, vTexCoord1 - 4.0 * blurSize) * 0.05;
  fragmentColor += texture2D(sampler1, vTexCoord1 - 3.0 * blurSize) * 0.09;
  fragmentColor += texture2D(sampler1, vTexCoord1 - 2.0 * blurSize) * 0.12;
  fragmentColor += texture2D(sampler1, vTexCoord1 - 1.0 * blurSize) * 0.15;
  fragmentColor += texture2D(sampler1, vTexCoord1                 ) * 0.16;
  fragmentColor += texture2D(sampler1, vTexCoord1 + 1.0 * blurSize) * 0.15;
  fragmentColor += texture2D(sampler1, vTexCoord1 + 2.0 * blurSize) * 0.12;
  fragmentColor += texture2D(sampler1, vTexCoord1 + 3.0 * blurSize) * 0.09;
  fragmentColor += texture2D(sampler1, vTexCoord1 + 4.0 * blurSize) * 0.05;

  fragmentColor += texture2D(sampler2, vec2(vTexCoord1.s, vTexCoord1.t));
  gl_FragColor = vec4(fragmentColor.rgb, 1.0);
}

