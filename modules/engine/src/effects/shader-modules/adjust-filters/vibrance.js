/**
 * @filter       Vibrance
 * @description  Modifies the saturation of desaturated colors, leaving saturated colors unmodified.
 * @param amount -1 to 1 (-1 is minimum vibrance, 0 is no change, and 1 is maximum vibrance)
 */
const fs = `\
uniform float amount;

vec4 vibrance_filterColor(vec4 color) {
  float average = (color.r + color.g + color.b) / 3.0;
  float mx = max(color.r, max(color.g, color.b));
  float amt = (mx - average) * (-amount * 3.0);
  color.rgb = mix(color.rgb, vec3(mx), amt);
  return color;
}

vec4 vibrance_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return vibrance_filterColor(color);
}
`;

const uniforms = {
  amount: {value: 0, min: -1, max: 1}
};

export default {
  name: 'vibrance',
  uniforms,
  fs,

  passes: [{filter: true}]
};
