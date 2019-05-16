/**
 * @filter       Triangle Blur
 * @description  This is the most basic blur filter, which convolves the image with a
 *               pyramid filter. The pyramid filter is separable and is applied as two
 *               perpendicular triangle filters.
 * @param radius The radius of the pyramid convolved with the image.
 */
import random from '../utils/random';

const fs = `\
uniform float radius;
uniform vec2 delta;

vec4 triangleBlur_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 adjustedDelta = delta * radius / texSize;

  vec4 color = vec4(0.0);
  float total = 0.0;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec4 sample = texture2D(texture, texCoord + adjustedDelta * percent);

    /* switch to pre-multiplied alpha to correctly blur transparent images */
    sample.rgb *= sample.a;

    color += sample * weight;
    total += weight;
  }

  color = color / total;

  /* switch back from pre-multiplied alpha */
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

const uniforms = {
  radius: {value: 20, min: 0, softMax: 100},
  delta: {value: [1, 0], private: true}
};

export default {
  name: 'triangleBlur',
  uniforms,
  fs,
  dependencies: [random],
  passes: [{sampler: true, uniforms: {delta: [1, 0]}}, {sampler: true, uniforms: {delta: [0, 1]}}]
};
