#define SHADER_NAME spec-map-fs

#ifdef GL_ES
precision highp float;
#endif

// IMPORT lighting

uniform float shininess;
uniform bool enableSpecularMap;
uniform bool enableColorMap;

uniform bool hasTexture1;
uniform sampler2D sampler1;

varying vec4 vColor;
varying vec2 vTexCoord1;

void main(void) {
  vec4 color;
  if (enableColorMap) {
    color += texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
  } else {
    color = vColor;
  }

  float shininess = material_uShininess;
  if (enableSpecularMap) {
    shininess = texture2D(sampler2, vec2(vTexCoord1.s, vTexCoord1.t)).r * 255.0;
  }

  if (shininess > 255.0) {
    shininess = material_uShininess;
  }

  gl_FragColor = lighting_apply(color, shininess);
}
