#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D sampler1;
uniform vec3 cameraPosition;
varying vec4 vPosition;
varying vec2 vTexCoord;
varying vec4 vNormal;

void main(void) {
  gl_FragColor = vec4(0.8 + 0.3 * vec3(dot(normalize(cameraPosition - vPosition.xyz),normalize(vNormal.xyz))),1);
}
