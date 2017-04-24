// Default Shaders
import vs from './default-vertex.glsl';
import fs from './default-fragment.glsl';
const defaultUniforms = require('./default-uniforms');

module.exports = {
  default: {
    vs,
    fs,
    defaultUniforms
  }
};
