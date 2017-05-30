export default `\
#define SHADER_NAME luma-default-fragment

#ifdef GL_ES
precision highp float;
#endif

// varyings
varying vec4 vColor;
varying vec4 vPickingColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;
varying vec3 vReflection;
varying vec4 vNormal;

// texture configs
uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform bool hasTextureCube1;
uniform samplerCube samplerCube1;

// picking configs
uniform bool enablePicking;
uniform bool hasPickingColors;
uniform vec3 pickColor;

// reflection / refraction configs
uniform float reflection;
uniform float refraction;

// fog configuration
uniform bool hasFog;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main(){
  // set color from texture
  if (!hasTexture1) {
    gl_FragColor = vec4(vColor.rgb, vColor.a);
  } else {
    gl_FragColor =
      vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb, 1.0);
  }
  // gl_FragColor.rgba *= lightWeighting

  // has cube texture then apply reflection
  // if (hasTextureCube1) {
  //   vec3 nReflection = normalize(vReflection);
  //   vec3 reflectionValue;
  //   if (refraction > 0.0) {
  //    reflectionValue = refract(nReflection, vNormal.xyz, refraction);
  //   } else {
  //    reflectionValue = -reflect(nReflection, vNormal.xyz);
  //   }

  //   // TODO(nico): check whether this is right.
  //   vec4 cubeColor = textureCube(samplerCube1,
  //       vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));
  //   gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);
  // }

  // set picking
  // if (enablePicking) {
  //   if (hasPickingColors) {
  //     gl_FragColor = vPickingColor;
  //   } else {
  //     gl_FragColor = vec4(pickColor, 1.0);
  //   }
  // }

  // handle fog
  // if (hasFog) {
  //   float depth = gl_FragCoord.z / gl_FragCoord.w;
  //   float fogFactor = smoothstep(fogNear, fogFar, depth);
  //   gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
  // }
}
`;
