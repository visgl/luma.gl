// luma.gl
// SPDX-License-Identifier: MIT
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

// Post-processing Modules (Shader passes)
// Blur Filters
import './modules/postprocessing/image-blur-filters/tiltshift.spec';
import './modules/postprocessing/image-blur-filters/triangleblur.spec';
import './modules/postprocessing/image-blur-filters/zoomblur.spec';

import './modules/postprocessing/image-adjust-filters/brightnesscontrast.spec';
import './modules/postprocessing/image-adjust-filters/denoise.spec';
import './modules/postprocessing/image-adjust-filters/huesaturation.spec';
import './modules/postprocessing/image-adjust-filters/noise.spec';
import './modules/postprocessing/image-adjust-filters/sepia.spec';
import './modules/postprocessing/image-adjust-filters/vibrance.spec';
import './modules/postprocessing/image-adjust-filters/vignette.spec';

import './modules/postprocessing/image-fun-filters/colorhalftone.spec';
import './modules/postprocessing/image-fun-filters/dotscreen.spec';
import './modules/postprocessing/image-fun-filters/edgework.spec';
import './modules/postprocessing/image-fun-filters/hexagonalpixelate.spec';
import './modules/postprocessing/image-fun-filters/ink.spec';

import './modules/postprocessing/image-warp-filters/bulgepinch.spec';
import './modules/postprocessing/image-warp-filters/swirl.spec';
import './modules/postprocessing/image-warp-filters/warp.spec';

// Tests for V8 shader modules

// Math modules
// TODO - these are breaking in test-browser but not in test-headless??
import './modules-webgl1/fp64/fp64-arithmetic-transform.spec';
import './modules-webgl1/fp64/fp64-utils.spec';

// Light and picking
// import './modules-webgl1/dirlight/dirlight.spec';
import './modules-webgl1/lights/lights.spec';
// import './modules-webgl1/phong-lighting/phong-lighting.spec';
// import './modules-webgl1/picking/picking.spec';
