// Imports tests for all modules that depend on webgl

// Import luma debug module to assist with debugging test failures
import '@luma.gl/debug';

// Generic helper modules
import '../modules/webgl2-polyfill/test';
import '../modules/webgl-state-tracker/test';

// luma.gl core module: Test webgl-dependent code now
import '../modules/webgl/test';
import '../modules/core/test/webgl-dependent-tests';

// luma.gl sub modules
import '../modules/debug/test/';
import '../modules/gpgpu/test/';
import '../modules/effects/test';

// The classic "unscoped" luma.gl module (Supported for backwards compatibility)
import '../modules/main//test';
