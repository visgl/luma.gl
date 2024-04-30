// import {ShaderModule} from '../../types';

// TODO - reuse normal from geometry module
const vs = /* glsl */ `\
varying vec4 geometry_vPosition;
varying vec3 geometry_vNormal;

void geometry_setNormal(vec3 normal) {
  geometry_vNormal = normal;
}

void geometry_setPosition(vec4 position) {
  geometry_vPosition = position;
}

void geometry_setPosition(vec3 position) {
  geometry_vPosition = vec4(position, 1.);
}
`;

const fs = /* glsl */ `\
varying vec4 geometry_vPosition;
varying vec3 geometry_vNormal;

vec4 geometry_getPosition() {
  return geometry_vPosition;
}

vec3 geometry_getNormal() {
  return geometry_vNormal;
}
`;

/**
 * Geometry varyings
 */
export const geometry = {
  name: 'geometry',
  vs,
  fs
};
