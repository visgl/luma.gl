import {readFileSync} from 'fs';
import {join} from 'path';

export const name = 'picking';
export const vertexShader = readFileSync(join(__dirname, './picking-vertex.glsl'));
export const fragmentShader = readFileSync(join(__dirname, './picking-fragment.glsl'));

/* eslint-disable camelcase */
export function getUniforms({enable = true} = {}) {
  return {
    picking_enable: enable
  };
}
