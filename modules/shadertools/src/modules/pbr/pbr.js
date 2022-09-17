/** @typedef {import('../../types').ShaderModule} ShaderModule */

import {lights} from '../lights/lights';

import vs from './pbr-vertex.glsl';
import fs from './pbr-fragment.glsl';

/**
 * @type {ShaderModule}
 * PBR lighting shader module
 */
export const pbr = {
  name: 'pbr',
  vs,
  fs,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  dependencies: [lights]
};
