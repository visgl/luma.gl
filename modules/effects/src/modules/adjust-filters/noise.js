/**
 * @filter         Noise
 * @description    Adds black and white noise to the image.
 * @param amount   0 to 1 (0 for no effect, 1 for maximum noise)
 */
const fs = `\
uniform float amount;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 noise_filterColor(vec4 color, vec2 texCoord) {
  float diff = (rand(texCoord) - 0.5) * amount;
  color.r += diff;
  color.g += diff;
  color.b += diff;
  return color;
}

vec4 noise_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return noise_filterColor(color, texCoord);
}
`;

const uniforms = {
  amount: {value: 0.5, min: 0, max: 1}
};

export default {
  name: 'noise',
  uniforms,
  fs,

  passes: [{filter: true}]
};
