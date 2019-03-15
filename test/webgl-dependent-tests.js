// Imports tests for all modules that depend on webgl

// Import luma debug module to assist with debugging test failures
import '@luma.gl/debug';

// Generic helper modules
import '../modules/constants/test';
import '../modules/webgl2-polyfill/test';
import '../modules/webgl-state-tracker/test';
import '../modules/debug/test/';

// luma.gl core module: Test webgl-dependent code now
import '../modules/core/test/webgl-dependent-tests';

import '../modules/addons/test/';

// luma.gl sub modules
import '../modules/gpgpu/test/';
import '../modules/effects/test';
import '../modules/glfx/test/';

// The classic "unscoped" luma.gl module (Supported for backwards compatibility)
import '../modules/main//test';
