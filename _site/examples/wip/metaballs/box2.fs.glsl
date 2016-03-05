#ifdef GL_ES
precision highp float;
#endif
//varyings
varying vec3 vReflection;
varying vec4 vNormal;
//texture configs
uniform bool hasTextureCube1;
uniform bool hasTextureCube2;
uniform samplerCube samplerCube1;
uniform samplerCube samplerCube2;
uniform float delta;

void main(){
  //has cube texture then apply reflection
  if (hasTextureCube1) {
    vec3 nReflection = normalize(vec3(vReflection.x, -vReflection.y, vReflection.z));
    vec3 reflectionValue = -reflect(nReflection, vNormal.xyz);
    vec4 color1 = textureCube(samplerCube1, reflectionValue);
    vec4 endColor;

    if (hasTextureCube2) {
      vec4 color2 = textureCube(samplerCube2, reflectionValue);
      endColor = color1 + delta * (color2 - color1);
    } else {
      endColor = color1;
    }

    gl_FragColor = endColor;

  }
}


