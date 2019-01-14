import project2 from '../project2/project2';

import vs from './pbr-vertex.glsl';
import fs from './pbr-fragment.glsl';

export default {
  name: 'pbr',
  vs,
  fs,
  dependencies: [project2]
  // getUniforms
};
