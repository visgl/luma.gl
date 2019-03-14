import project2 from '../project2/project2';
import lighting from '../lighting/lighting';

import vs from './pbr-vertex.glsl';
import fs from './pbr-fragment.glsl';

export default {
  name: 'pbr',
  vs,
  fs,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  dependencies: [project2, lighting]
  // getUniforms
};
