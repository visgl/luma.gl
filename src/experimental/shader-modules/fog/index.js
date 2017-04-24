export const name = 'fog';
export const vertexShader = '';
export {default as fragmentShader} from './fog-fragment.glsl';

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
