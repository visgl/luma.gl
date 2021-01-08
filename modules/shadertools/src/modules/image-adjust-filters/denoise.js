/** @typedef {import('../../types').ShaderPass} ShaderPass */

// Do a 9x9 bilateral box filter
const fs = `\
uniform float strength;

vec4 denoise_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  float adjustedExponent = 3. + 200. * pow(1. - strength, 4.);

  vec4 center = texture2D(texture, texCoord);
  vec4 color = vec4(0.0);
  float total = 0.0;
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      vec4 sample = texture2D(texture, texCoord + vec2(x, y) / texSize);
      float weight = 1.0 - abs(dot(sample.rgb - center.rgb, vec3(0.25)));
      weight = pow(weight, adjustedExponent);
      color += sample * weight;
      total += weight;
    }
  }

  return color / total;
}
`;

const uniforms = {
  strength: {
    value: 0.5,
    min: 0,
    max: 0.1,
    adjust: strength => 0.53 + 200 * Math.pow(1 - strength, 4) // TODO - JS preprocessing
  }
};

/** @type {ShaderPass} */
export const denoise = {
  name: 'denoise',
  uniforms,
  fs,
  passes: [{sampler: true}, {sampler: true}]
};
