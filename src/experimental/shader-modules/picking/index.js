export const name = 'picking';
export {default as vertexShader} from './picking-vertex.glsl';
export {default as fragmentShader} from './picking-fragment.glsl';

/* eslint-disable camelcase */
export function getUniforms({enable = true} = {}) {
  return {
    picking_enable: enable
  };
}
