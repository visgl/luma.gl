/* eslint-disable no-var */

// Default Shaders
const glslify = require('glslify');

const vs = glslify('shaderlib/default-vertex.glsl');
const fs = glslify('shaderlib/default-fragment.glsl');
const defaultUniforms = require('../../shaderlib/default-uniforms');

module.exports = {
  DEFAULT: {
    vs,
    fs,
    defaultUniforms
  }
};
