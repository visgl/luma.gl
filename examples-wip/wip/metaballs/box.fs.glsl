#ifdef GL_ES
precision highp float;
#endif
//varyings
varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;
varying vec3 vReflection;
varying vec4 vNormal;
//texture configs
uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform bool hasTextureCube1;
uniform samplerCube samplerCube1;
uniform bool hasTextureCube2;
uniform samplerCube samplerCube2;
uniform float delta;
//reflection / refraction configs
uniform float reflection;
uniform float refraction;

void main(){
  //set color from texture
  if (!hasTexture1) {
    gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);
  } else {
    gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);
  }
  //has cube texture then apply reflection
  if (hasTextureCube1) {
    vec3 nReflection = normalize(vReflection);
    vec3 reflectionValue;
    if (refraction > 0.0) {
      reflectionValue = refract(nReflection, vNormal.xyz, refraction);
    } else {
      reflectionValue = -reflect(nReflection, vNormal.xyz);
    }
    //TODO(nico): check whether this is right.
    vec4 cubeColor = textureCube(samplerCube1, vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));
    vec4 endColor;
    if (hasTextureCube2) {
      vec4 cubeColor2 = textureCube(samplerCube2, vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));
      endColor = cubeColor + delta * (cubeColor2 - cubeColor);
    } else {
      endColor = cubeColor;
    }
    gl_FragColor = vec4(mix(gl_FragColor.xyz, endColor.xyz, reflection), 1.0);
  }
}
