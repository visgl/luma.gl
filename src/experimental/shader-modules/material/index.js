export const name = 'material';
export {default as vertexShader} from './material-vertex.glsl';
export {default as fragmentShader} from './material-fragment.glsl';

/* eslint-disable camelcase */
export function getUniforms({
  enable = true
} = {}) {
  return {
    picking_enable: enable
  };
}
