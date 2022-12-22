// import type {ShaderPass} from '../../lib/shader-pass-descriptor';
import {glsl} from '../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform float radius;
uniform float amount;

vec4 vignette_filterColor(vec4 color, vec2 texCoord) {
  float dist = distance(texCoord, vec2(0.5, 0.5));
  float ratio = smoothstep(0.8, radius * 0.799, dist * (amount + radius));
  return color.rgba * ratio + (1.0 - ratio)*vec4(0.0, 0.0, 0.0, 1.0);
}

vec4 vignette_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return vignette_filterColor(color, texCoord);
}
`;

const uniforms = {
  radius: {value: 0.5, min: 0, max: 1},
  amount: {value: 0.5, min: 0, max: 1}
};

/**
 * Vignette -
 * Adds a simulated lens edge darkening effect.
 * @param radius   0 to 1 (0 for center of frame, 1 for edge of frame)
 * @param amount   0 to 1 (0 for no effect, 1 for maximum lens darkening)
 */
 export const vignette = {
  name: 'vignette',
  fs,
  uniforms,
  passes: [{filter: true}]
};
