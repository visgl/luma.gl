// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// utils
import './lib/glsl-utils/get-shader-info.spec';
import './lib/glsl-utils/shader-utils.spec';

// shader transpilation
import './lib/shader-transpiler/transpile-shader.spec';

// shader generation
import './lib/generator/generate-shader.spec';

// WGSL parsing
import './lib/wgsl/get-shader-layout-wgsl.spec';

// SHADER MODULE API

import './lib/shader-module/shader-module.spec';
import './lib/shader-assembly/resolve-modules.spec';
import './lib/shader-assembly/inject-shader.spec';
import './lib/shader-assembly/assemble-shaders.spec';
import './lib/shader-assembler.spec';

// SHADER MODULE LIBRARY

// Lighting
import './modules-ubo/lighting/dirlight.spec';
// import './modules-ubo/lights/lights.spec';
import './modules-ubo/lighting/phong-material.spec';
import './modules-ubo/lighting/goraud-material.spec';

// Engine
import './modules-ubo/engine/picking.spec';

// Tests for V8 shader modules
import './modules-webgl';
