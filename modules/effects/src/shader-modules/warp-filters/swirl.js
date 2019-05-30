/**
 * @filter        Swirl
 * @description   Warps a circular region of the image in a swirl.
 * @param centerX The x coordinate of the center of the circular region.
 * @param centerY The y coordinate of the center of the circular region.
 * @param radius  The radius of the circular region.
 * @param angle   The angle in radians that the pixels in the center of
 *                the circular region will be rotated by.
 */
import warp from './warp';

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

export default {
  name: 'swirl',
  uniforms,
  fs,
  dependencies: [warp],

  passes: [{sampler: true}]
};
