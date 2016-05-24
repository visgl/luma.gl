/* eslint-disable no-var */

// Default Shaders
const glslify = require('glslify');

const vertex = glslify('../../shaderlib/default-vertex.glsl');
const fragment = glslify('../../shaderlib/default-fragment.glsl');

export default {
  Vertex: {Default: vertex},
  Fragment: {Default: fragment},
  vs: vertex,
  fs: fragment
};
