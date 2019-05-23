// Quick random generator for fragment shaders
const fs = `\
float random(vec3 scale, float seed) {
  /* use the fragment position for a different seed per-pixel */
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}
`;

export default {
  name: 'random',
  fs
};
