// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// SHADER MODULE API

import './lib/shader-module/shader-module.spec';
import './lib/shader-module/shader-module-dependencies.spec';

// utils
import './lib/glsl-utils/get-shader-info.spec';
import './lib/glsl-utils/shader-utils.spec';

// WGSL parsing
import './lib/wgsl/get-shader-layout-wgsl.spec';

// shader transpilation
import './lib/preprocessor/preprocessor.spec';
import './lib/shader-transpiler/transpile-shader.spec';

// shader generation
import './lib/generator/generate-shader.spec';

// SHADER ASSEMBLY

import './lib/shader-assembly/inject-shader.spec';
import './lib/shader-assembly/assemble-shaders.spec';
import './lib/shader-assembler.spec';

// SHADER MODULE LIBRARY

// Data utilities
import './modules/math/fp16-utils.spec';
import './modules/math/fp64-utils.spec';

// General modules tests
import './modules/modules.spec';

// Math modules
import './modules/utils/random.spec';

// Lighting
import './modules/lighting/dirlight.spec';
// import './modules/lights/lights.spec';
import './modules/lighting/phong-material.spec';
import './modules/lighting/gouraud-material.spec';

// Engine
import './modules/engine/picking.spec';

// Tests for V8 shader modules

// Math modules
// TODO - these are breaking in test-browser but not in test-headless??
import './modules-webgl1/fp64/fp64-arithmetic-transform.spec';

// Light and picking
// import './modules-webgl1/dirlight/dirlight.spec';
import './modules-webgl1/lights/lights.spec';
// import './modules-webgl1/phong-lighting/phong-lighting.spec';
// import './modules-webgl1/picking/picking.spec';
