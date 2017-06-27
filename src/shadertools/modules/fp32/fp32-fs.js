import {default as fp32} from '/math-fp32.glsl';

export default {
  name: 'fp32',
  vs: null,
  fs: fp32,
  getUniforms: () => ({})
};
