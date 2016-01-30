#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;

#define LIGHT_MAX 4
#define PI 3.1415926535
varying vec2 vTexCoord;
varying vec4 vColor;
varying vec4 vPosition;
uniform vec3 cameraPosition;
uniform mat4 viewMatrix;
uniform mat4 viewInverseMatrix;
uniform sampler2D sampler1, sampler2, sampler3, sampler4, sampler5, sampler6;
// uniform samplerCube samplerCube2;
uniform mat4 objectMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseMatrix;
uniform float n1, n2;
uniform float renderType;
uniform vec3 plainU;
uniform vec3 plainV;
uniform vec3 plainC;

#include "packing.glsl"
#include "env.glsl"
#include "raytrace.glsl"

vec4 sample(vec3 direction) {
  vec3 from = vPosition.xyz;
  vec3 hit = plainRT(direction, from, plainU, plainV, plainC);
  if (abs(hit.x) <= 1.0 && abs(hit.y) <= 1.0 && hit.z >= 0.0) {
    vec2 samp = vec2((hit.x + 1.0) * 0.5, (hit.y + 1.0) * 0.5);
    return texture2D(sampler6, vec2(samp.x, samp.y * 2.));
  }
  return envSampling(direction, vPosition.xyz, sampler2, sampler3, sampler4, sampler5, sampler6);
}

float height(vec2 position) {
  return texture2DBilinearDecoded(sampler1, position);
}

vec4 shot(vec3 position) {
  float n = n1 / n2;
  float samp = height(vTexCoord);
  float sampRight = height(vTexCoord + vec2(1.0 / RESOLUTIONX, 0));
  float sampTop = height(vTexCoord + vec2(0, 1.0 / RESOLUTIONY));
  vec3 normal = normalize(vec3(vec2((sampRight - samp) * RESOLUTIONX, (sampTop -  samp) * RESOLUTIONY), 1));

  vec3 eyeDirection = normalize(position.xyz - cameraPosition);
  vec3 reflectVec = reflect(eyeDirection, normal);
  vec4 reflectColor = sample(reflectVec);
  vec3 refractVec;
  vec4 refractColor = vec4(0);
  vec4 reflectFilter = vec4(1);
  vec4 refractFilter = vec4(0.8, 0.9, 1., 1);
  float reflectionFactor = 0.;

  // http://en.wikipedia.org/wiki/Fresnel_equations
  if (dot(eyeDirection, normal) > 0.) {
    normal = -normal;
    n = 1. / n;
    reflectFilter = vec4(0.6, 0.8, 1., 1);
    refractFilter = vec4(0.8, 0.9, 1., 1);
  }

  refractVec = refract(eyeDirection, normal, n);
  refractColor = sample(refractVec);

  float cosSi = dot(-eyeDirection, normal);
  float refl = clamp(sqrt(1. - cosSi * cosSi) * n, -1., 1.);
  float cosSt = sqrt(1. - refl * refl);
  float sist = cosSi / cosSt;
  float Rs = 1. - 2. / (n * sist + 1.);
  float Rp = 1. - 2. / (n / sist + 1.);
  Rs *= Rs;
  Rp *= Rp;
  reflectionFactor = (Rs + Rp) * 0.5;
  return mix(reflectColor * reflectFilter, refractColor * refractFilter, 1. - reflectionFactor);
}

void main(void) {
  float px = .005;
  float MULT = 1e-25;
  float v = (vPosition.x + 0.5) * MULT;
//  gl_FragColor = vec4(decode(encode(v)), v, v, 1) / MULT;
  gl_FragColor = shot(vPosition.xyz);
}
