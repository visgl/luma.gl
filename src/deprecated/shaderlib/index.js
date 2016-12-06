import {readFileSync} from 'fs';
import {join} from 'path';

// Default Shaders
const vs = readFileSync(join(__dirname, './default-vertex.glsl'), 'utf8');
const fs = readFileSync(join(__dirname, './default-fragment.glsl'), 'utf8');
const defaultUniforms = require('./default-uniforms');

module.exports = {
  default: {
    vs,
    fs,
    defaultUniforms
  }
};
