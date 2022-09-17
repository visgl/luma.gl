/** @typedef {import('../../types').ShaderPass} ShaderPass */

const fs = `\
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

/** @type {ShaderPass} */
export const vignette = {
  name: 'vignette',
  fs,
  uniforms,
  passes: [{filter: true}]
};
