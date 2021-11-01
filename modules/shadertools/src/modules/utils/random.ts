/** @typedef {import('../../types').ShaderModule} ShaderModule */

const fs = `\
float random(vec3 scale, float seed) {
  /* use the fragment position for a different seed per-pixel */
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}
`;

/** Quick random generator for fragment shaders */
export const random = {
  name: 'random',
  fs
};
