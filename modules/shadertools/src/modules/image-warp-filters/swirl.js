/** @typedef {import('../../types').ShaderPass} ShaderPass */
import {warp} from './warp';

const fs = `\
uniform float radius;
uniform float angle;
uniform vec2 center;

vec2 swirl_warp(vec2 coord, vec2 texCenter) {
  coord -= texCenter;
  float distance = length(coord);
  if (distance < radius) {
    float percent = (radius - distance) / radius;
    float theta = percent * percent * angle;
    float s = sin(theta);
    float c = cos(theta);
    coord = vec2(
      coord.x * c - coord.y * s,
      coord.x * s + coord.y * c
    );
  }
  coord += texCenter;
  return coord;
}

vec4 swirl_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 coord = texCoord * texSize;
  coord = swirl_warp(coord, center * texSize);

  return warp_sampleColor(texture, texSize, coord);
}
`;

const uniforms = {
  center: [0.5, 0.5],
  radius: {value: 200, min: 1, softMax: 600},
  angle: {value: 3, softMin: -25, softMax: 25}
};

/** @type {ShaderPass} */
export const swirl = {
  name: 'swirl',
  fs,
  uniforms,
  dependencies: [warp],
  passes: [{sampler: true}]
};
