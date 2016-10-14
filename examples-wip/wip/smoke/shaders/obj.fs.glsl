#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D sampler1;
uniform vec3 lightPosition, cameraPosition;
varying vec4 vPosition;
varying vec2 vTexCoord;
varying vec4 vNormal;

void main(void) {
  float light = 0.5 * abs(dot(normalize(lightPosition - vPosition.xyz), vNormal.xyz));
  light *= 5. / (.1 + pow(distance(lightPosition, vPosition.xyz), 2.));
  vec3 tex = vec3(texture2D(sampler1, vTexCoord).z);
  gl_FragColor = vec4(tex * light + 0.3,1);
}
