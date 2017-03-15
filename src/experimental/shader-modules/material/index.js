import {readFileSync} from 'fs';
import {join} from 'path';

export const name = 'material';
export const vertexShader = readFileSync(join(__dirname, './material-vertex.glsl'));
export const fragmentShader = readFileSync(join(__dirname, './material-fragment.glsl'));

/* eslint-disable camelcase */
export function getUniforms({
  enable = true
} = {}) {
  return {
    picking_enable: enable
  };
}
