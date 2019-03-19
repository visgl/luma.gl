import Instancing from '../../../examples/core/instancing/app';
import Cubemap from '../../../examples/core/cubemap/app';
// import CustomPicking from '../../../examples/core/custom-picking/app';
// import DeferredRendering from '../../../examples/core/deferred-rendering/app';
import DOF from '../../../examples/core/dof/app';
import GLTF from '../../../examples/core/gltf/app';
import Fragment from '../../../examples/core/fragment/app';
import Mandelbrot from '../../../examples/core/mandelbrot/app';
// import Particles from '../../../examples/core/particles/app';
import Persistence from '../../../examples/core/persistence/app';
// import Picking from '../../../examples/core/picking/app';
import Quasicrystals from '../../../examples/core/quasicrystals/app';
import Shadowmap from '../../../examples/core/shadowmap/app';
import Texture3D from '../../../examples/core/texture-3d/app';
import Transform from '../../../examples/core/transform/app';
import TransformFeedback from '../../../examples/core/transform-feedback/app';

import Lesson01 from '../../../examples/lessons/01/app';
import Lesson02 from '../../../examples/lessons/02/app';
import Lesson03 from '../../../examples/lessons/03/app';
import Lesson04 from '../../../examples/lessons/04/app';
import Lesson05 from '../../../examples/lessons/05/app';
import Lesson06 from '../../../examples/lessons/06/app';
import Lesson07 from '../../../examples/lessons/07/app';
import Lesson08 from '../../../examples/lessons/08/app';
import Lesson09 from '../../../examples/lessons/09/app';
import Lesson10 from '../../../examples/lessons/10/app';
import Lesson11 from '../../../examples/lessons/11/app';
import Lesson12 from '../../../examples/lessons/12/app';
import Lesson13 from '../../../examples/lessons/13/app';
import Lesson14 from '../../../examples/lessons/14/app';
import Lesson15 from '../../../examples/lessons/15/app';
import Lesson16 from '../../../examples/lessons/16/app';

// export const examplesPath = 'https://github.com/uber/luma.gl/tree/master/examples';

export default {
  Instancing: {app: Instancing, path: 'examples/core/instancing/'},
  Cubemap: {app: Cubemap, path: 'examples/core/cubemap/'},
  DOF: {app: DOF, path: 'examples/core/dof/'},
  // CustomPicking: {}
  // DeferredRendering: {}
  Mandelbrot: {app: Mandelbrot, path: 'examples/core/mandelbrot/'},
  Fragment: {app: Fragment, path: 'examples/core/fragment/'},
  // Particles: {app: Particles, path: 'examples/core/particles/'},
  Persistence: {app: Persistence, path: 'examples/core/persistence/'},
  // Picking: {app: Picking, path: 'examples/core/picking/'},
  Quasicrystals: {app: Quasicrystals, path: 'examples/core/quasicrystals/'},
  Shadowmap: {app: Shadowmap, path: 'examples/core/shadowmap/'},
  Texture3D: {app: Texture3D, path: 'examples/core/texture3d/'},
  Transform: {app: Transform, path: 'examples/core/transform/'},
  TransformFeedbackDemo: {app: TransformFeedback, path: 'examples/core/transform-feedback/'},

  GLTF: {app: GLTF, path: 'examples/core/gltf'},

  Lesson01: {app: Lesson01, path: 'examples/lessons/01/'},
  Lesson02: {app: Lesson02, path: 'examples/lessons/02/'},
  Lesson03: {app: Lesson03, path: 'examples/lessons/03/'},
  Lesson04: {app: Lesson04, path: 'examples/lessons/04/'},
  Lesson05: {app: Lesson05, path: 'examples/lessons/05/'},
  Lesson06: {app: Lesson06, path: 'examples/lessons/06/'},
  Lesson07: {app: Lesson07, path: 'examples/lessons/07/'},
  Lesson08: {app: Lesson08, path: 'examples/lessons/08/'},
  Lesson09: {app: Lesson09, path: 'examples/lessons/09/'},
  Lesson10: {app: Lesson10, path: 'examples/lessons/10/'},
  Lesson11: {app: Lesson11, path: 'examples/lessons/11/'},
  Lesson12: {app: Lesson12, path: 'examples/lessons/12/'},
  Lesson13: {app: Lesson13, path: 'examples/lessons/13/'},
  Lesson14: {app: Lesson14, path: 'examples/lessons/14/'},
  Lesson15: {app: Lesson15, path: 'examples/lessons/15/'},
  Lesson16: {app: Lesson16, path: 'examples/lessons/16/'},
}

/*
export default {
  Instancing,
  Cubemap,
  // CustomPicking,
  // DeferredRendering,
  Mandelbrot,
  Fragment,
  // Particles,
  // Persistence,
  Picking,
  Shadowmap,
  Transform,
  TransformFeedback,

  Lesson01,
  Lesson02,
  Lesson03,
  Lesson04,
  Lesson05,
  Lesson06,
  Lesson07,
  Lesson08,
  Lesson09,
  Lesson10,
  Lesson11,
  Lesson12,
  Lesson13,
  Lesson14,
  Lesson15,
  Lesson16
};
*/