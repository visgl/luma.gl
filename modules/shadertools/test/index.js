import './utils/is-old-ie.spec';

import './lib/glsl-utils/get-shader-info.spec';
import './lib/glsl-utils/shader-utils.spec';

import './lib/compiler-log/format-compiler-log.spec';

import './lib/inject-shader.spec.js';
import './lib/transpile-shader.spec.js';
import './lib/assemble-shaders.spec.js';
import './lib/resolve-modules.spec';
import './lib/shader-module.spec';

import './modules';

// TODO - Remove once WebGL1 support added to Transfrom
// so `fp64-arithmetic-transform.spec` can test under WebGL1 and WebGL2
// import '../src/modules/fp64/fp64-arithmetic.spec';
