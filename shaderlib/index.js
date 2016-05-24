// NOTE - ES5 export file
/* eslint-disable no-var */

// Default Shaders
var glslify = require('glslify');

module.exports = require('../dist/shaderlib-helpers');

var vertex = glslify('./default-vertex.glsl');
var fragment = glslify('./default-fragment.glsl');

Object.assign(module.exports, {
  Vertex: {Default: vertex},
  Fragment: {Default: fragment},
  vs: vertex,
  fs: fragment
});
