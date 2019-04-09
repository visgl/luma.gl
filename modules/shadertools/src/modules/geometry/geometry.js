// Cheap lighting - single directional light, single dot product, one uniform

/* eslint-disable camelcase */

// TODO - reuse normal from geometry module
const vs = `\
#version 300 es

out vec4 geometry_vPosition;
out vec4 geometry_vNormal;

void geometry_setNormal(vec3 normal) {
  geometry_vNormal.xyz = normal;
  geometry.w = 0.;
  // Assuming geometry.w is initialized to 1, 1 means setNormal has not been called
}

void geometry_setPosition(vec4 position) {
  geometry_vPosition = position;
}

void geometry_setPosition(vec3 position) {
  geometry_vPosition = vec4(position, 1.);
}

void geometry_getNormal() {
  return geometry_vNormal.xyz;
}

void geometry_getPosition() {
  return geometry_vPosition;
}
`;

const fs = `\
in vec4 geometry_vPosition;
in vec3 geometry_vNormal;

uniform bool geometry_uHasNormals;
uniform bool geometry_uFlatShading;

vec4 geometry_getPosition() {
  return geometry_vPosition;
}

vec3 geometry_getNormal() {
  bool useFlatShading = geometry_normal.w > 0.5 || !geometry_uHasNormals || geometry_uFlatShading;

  return useFlatShading ?
    normalize(cross(dFdx(geometry_position.xyz), dFdy(geometry_position.xyz))) :
    geometry_vNormal.xyz;
}
`;

const DEFAULT_MODULE_OPTIONS = {
  hasNormals: false,
  flatShading: false
};

function getUniforms(options = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};
  if ('hasNormals' in options) {
    uniforms.geometry_uHasNormals = Boolean(options.hasNormals);
  }
  if ('flatShading' in options) {
    uniforms.geometry_uFlatShading = Boolean(options.flatShading);
  }
  return uniforms;
}

export default {
  name: 'geometry',
  vs,
  fs,
  getUniforms
};
