// import type {ShaderPass} from '../../lib/shader-pass-descriptor';
import {glsl} from '../../lib/glsl-utils/highlight';
import {warp} from './warp';

const fs = glsl`\
uniform float radius;
uniform float strength;
uniform vec2 center;

vec2 bulgePinch_warp(vec2 coord, vec2 texCenter) {
  coord -= texCenter;
  float distance = length(coord);
  if (distance < radius) {
    float percent = distance / radius;
    if (strength > 0.0) {
      coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
    } else {
      coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);
    }
  }
  coord += texCenter;
  return coord;
}

vec4 bulgePinch_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 coord = texCoord * texSize;
  coord = bulgePinch_warp(coord, center * texSize);

  return warp_sampleColor(texture, texSize, coord);
}
`;

const uniforms = {
  center: [0.5, 0.5],
  radius: {value: 200, min: 1, softMax: 600},
  strength: {value: 0.5, min: -1, max: 1}
};

/**
 * Bulge / Pinch -
 * Bulges or pinches the image in a circle.
 * @param center  The [x, y] coordinates of the center of the circle of effect.
 * @param radius   The radius of the circle of effect.
 * @param strength -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge)
 */
export const bulgePinch = {
  name: 'bulgePinch',
  fs,
  uniforms,
  dependencies: [warp],
  passes: [{sampler: true}]
};
