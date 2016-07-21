#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uShadowMap;
uniform float uShadow;

varying vec4 shadowCoord;
varying vec3 normal;

void main(void) {
  float d = clamp(dot(normalize(normal), vec3(0,1,0)), 0.25, 1.0);
  float s = 1.0;
  if (texture2D(uShadowMap, shadowCoord.xy).z < shadowCoord.z - 0.005) {
    s -= 0.5 * uShadow;
  }
  float c = d * s;
  gl_FragColor = vec4(c,c,c,1);
}
