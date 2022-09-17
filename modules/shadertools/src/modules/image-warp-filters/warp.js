/** @typedef {import('../../types').ShaderModule} ShaderModule */

const fs = `\
vec4 warp_sampleColor(sampler2D texture, vec2 texSize, vec2 coord) {
  vec4 color = texture2D(texture, coord / texSize);
  vec2 clampedCoord = clamp(coord, vec2(0.0), texSize);
  if (coord != clampedCoord) {
    /* fade to transparent if we are outside the image */
    color.a *= max(0.0, 1.0 - length(coord - clampedCoord));
  }

  return color;
}
`;

/** @type {ShaderModule} */
export const warp = {
  name: 'warp',
  fs
};
