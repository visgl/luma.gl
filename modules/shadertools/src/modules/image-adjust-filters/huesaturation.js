/** @typedef {import('../../types').ShaderPass} ShaderPass */

const fs = `\
uniform float hue;
uniform float saturation;

vec4 hueSaturation_filterColor(vec4 color) {
  // hue adjustment, wolfram alpha: RotationTransform[angle, {1, 1, 1}][{x, y, z}]
  float angle = hue * 3.14159265;
  float s = sin(angle), c = cos(angle);
  vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
  float len = length(color.rgb);
  color.rgb = vec3(
    dot(color.rgb, weights.xyz),
    dot(color.rgb, weights.zxy),
    dot(color.rgb, weights.yzx)
  );

  // saturation adjustment
  float average = (color.r + color.g + color.b) / 3.0;
  if (saturation > 0.0) {
    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));
  } else {
    color.rgb += (average - color.rgb) * (-saturation);
  }

  return color;
}

vec4 hueSaturation_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return hueSaturation_filterColor(color);
}
`;

const uniforms = {
  hue: {value: 0, min: -1, max: 1},
  saturation: {value: 0, min: -1, max: 1}
};

/** @type {ShaderPass} */
export const hueSaturation = {
  name: 'hueSaturation',
  uniforms,
  fs,
  passes: [{filter: true}]
};
