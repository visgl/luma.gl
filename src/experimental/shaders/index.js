import {readFileSync} from 'fs';
import {join} from 'path';

// Default Shaders
const vs = readFileSync(join(__dirname, './default.vs.glsl'), 'utf8');
const fs = readFileSync(join(__dirname, './default.fs.glsl'), 'utf8');
const defaultUniforms = require('./default-uniforms');

export const SHADERS = {
  vs,
  fs,
  defaultUniforms
};
