/**
 * @filter           Brightness / Contrast
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */

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

export default {
  name: 'brightnessContrast',
  uniforms,
  fs,

  passes: [{filter: true}]
};
