/**
 * @filter       Edge Work
 * @description  Picks out different frequencies in the image by subtracting two
 *               copies of the image blurred with different radii.
 * @param radius The radius of the effect in pixels.
 */
import random from '../utils/random';

const fs = `\
uniform float radius;
uniform vec2 delta;

vec4 edgeWork_sampleColor1(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 relativeDelta = radius * delta / texSize;

  vec2 color = vec2(0.0);
  vec2 total = vec2(0.0);

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec3 sampleColor = texture2D(source, texCoord + relativeDelta * percent).rgb;
    float average = (sampleColor.r + sampleColor.g + sampleColor.b) / 3.0;
    color.x += average * weight;
    total.x += weight;
    if (abs(t) < 15.0) {
      weight = weight * 2.0 - 1.0;
      color.y += average * weight;
      total.y += weight;
    }
  }
  return vec4(color / total, 0.0, 1.0);
}

vec4 edgeWork_sampleColor2(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 relativeDelta = radius * delta / texSize;

  vec2 color = vec2(0.0);
  vec2 total = vec2(0.0);

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec2 sampleColor = texture2D(source, texCoord + relativeDelta * percent).xy;
    color.x += sampleColor.x * weight;
    total.x += weight;
    if (abs(t) < 15.0) {
      weight = weight * 2.0 - 1.0;
      color.y += sampleColor.y * weight;
      total.y += weight;
    }
  }
  float c = clamp(10000.0 * (color.y / total.y - color.x / total.x) + 0.5, 0.0, 1.0);
  return vec4(c, c, c, 1.0);
}
`;

const uniforms = {
  radius: {value: 2, min: 1, softMax: 50},
  delta: {value: [1, 0], private: true}
};

export default {
  name: 'edgeWork',
  uniforms,
  fs,
  dependencies: [random],
  passes: [
    {
      sampler: 'edgeWork_sampleColor1',
      uniforms: {delta: [1, 0]}
    },
    {
      sampler: 'edgeWork_sampleColor2',
      uniforms: {delta: [0, 1]}
    }
  ]
};
