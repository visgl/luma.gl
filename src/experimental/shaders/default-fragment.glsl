#define SHADER_NAME luma-default-fragment

#ifdef GL_ES
precision highp float;
#endif

// texture configs
uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform bool hasTextureCube1;
uniform samplerCube samplerCube1;

// picking configs
uniform bool enablePicking;
uniform bool hasPickingColors;
uniform vec3 pickColor;


// varyings
varying vec4 vColor;
varying vec4 vPickingColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;
varying vec3 vReflection;
varying vec4 vNormal;

vec4 main(){
  // set color from texture
  if (!hasTexture1) {
    gl_FragColor = vColor;
  } else {
    gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t));
  }

  gl_FragColor = lighting_filterColor(gl_FragColor);

  // handle fog
  if (hasFog) {
    gl_FragColor = fog_filterColor(gl_FragColor);
  }

  gl_FragColor = picking_getColor(gl_FragColor)
}
