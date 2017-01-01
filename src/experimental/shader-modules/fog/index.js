import {readFileSync} from 'fs';
import {join} from 'path';

export const name = 'fog';
export const vertexShader = '';
export const fragmentShader = readFileSync(join(__dirname, './fog-fragment.glsl'));

/* eslint-disable camelcase */
export function getUniforms({
  fogEnable = false,
  fogColor = [0.5, 0.5, 0.5],
  fogNear = 1,
  fogFar = 100
} = {}) {
  return {
    fog_uEnable: fogEnable,
    fog_uColor: fogColor,
    fog_uNear: fogNear,
    fog_uFar: fogFar
  };
}
