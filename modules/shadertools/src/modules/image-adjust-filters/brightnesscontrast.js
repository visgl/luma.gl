/** @typedef {import('../../types').ShaderPass} ShaderPass */

const fs = `\
uniform float brightness;
uniform float contrast;

vec4 brightnessContrast_filterColor(vec4 color) {
  color.rgb += brightness;
  if (contrast > 0.0) {
    color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;
  } else {
    color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;
  }
  return color;
}

vec4 brightnessContrast_filterColor(vec4 color, vec2 texSize, vec2 texCoords) {
  return brightnessContrast_filterColor(color);
}
`;

const uniforms = {
  brightness: {value: 0, min: -1, max: 1},
  contrast: {value: 0, min: -1, max: 1}
};

/** @type {ShaderPass} */
export const brightnessContrast = {
  name: 'brightnessContrast',
  uniforms,
  fs,
  passes: [{filter: true}]
};
