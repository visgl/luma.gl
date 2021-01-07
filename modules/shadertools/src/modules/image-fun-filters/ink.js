/** @typedef {import('../../types').ShaderPass} ShaderPass */

const fs = `\
uniform float strength;

vec4 ink_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoord) {
  vec2 dx = vec2(1.0 / texSize.x, 0.0);
  vec2 dy = vec2(0.0, 1.0 / texSize.y);
  vec4 color = texture2D(texture, texCoord);
  float bigTotal = 0.0;
  float smallTotal = 0.0;
  vec3 bigAverage = vec3(0.0);
  vec3 smallAverage = vec3(0.0);
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec3 sample = texture2D(texture, texCoord + dx * x + dy * y).rgb;
      bigAverage += sample;
      bigTotal += 1.0;
      if (abs(x) + abs(y) < 2.0) {
        smallAverage += sample;
        smallTotal += 1.0;
      }
    }
  }
  vec3 edge = max(vec3(0.0), bigAverage / bigTotal - smallAverage / smallTotal);
  float power = strength * strength * strength * strength * strength;
  return vec4(color.rgb - dot(edge, edge) * power * 100000.0, color.a);
}
`;

const uniforms = {
  strength: {value: 0.25, min: 0, softMax: 1}
};

/** @type {ShaderPass} */
export const ink = {
  name: 'ink',
  uniforms,
  fs,
  passes: [{sampler: true}]
};
