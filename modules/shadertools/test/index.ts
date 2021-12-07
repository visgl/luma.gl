import './lib/glsl-utils/get-shader-info.spec';
import './lib/glsl-utils/shader-utils.spec';

import './lib/compiler-log/format-compiler-log.spec';

import './lib/transpiler/transpile-shader.spec';

import './lib/shader-assembler/inject-shader.spec';
import './lib/shader-assembler/assemble-shaders.spec';
import './lib/shader-assembler/resolve-modules.spec';
import './lib/shader-assembler/shader-module.spec';

import './modules';

// TODO - Remove once WebGL1 support added to Transfrom
// so `fp64-arithmetic-transform.spec` can test under WebGL1 and WebGL2
// import '../src/modules/fp64/fp64-arithmetic.spec';
