// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// utils
import './lib/glsl-utils/get-shader-info.spec';
import './lib/glsl-utils/shader-utils.spec';

// shader transpilation
import './lib/shader-transpiler/transpile-shader.spec';

// shader generation
import './lib/generator/generate-shader.spec';

// shader-module
import './lib/shader-module/shader-module.spec';

import './lib/shader-assembly/resolve-modules.spec';
import './lib/shader-assembly/inject-shader.spec';
import './lib/shader-assembly/assemble-shaders.spec';

import './lib/shader-assembler.spec';

// Tests for shader modules
import './modules';
import './modules-ubo';
