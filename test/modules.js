// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '../modules/shadertools/test';
// luma.gl core module: Test webgl-independent code, ensure webgl dependencies don't creep in
import '../modules/core/test/webgl-independent-tests';

// WEBGL-DEPENDENT TESTS

// Import luma debug module to assist with debugging test failures
import '@luma.gl/debug';

// Generic webgl helper modules
import '../modules/constants/test';
import '../modules/webgl2-polyfill/test';
import '../modules/webgl-state-tracker/test';
import '../modules/debug/test/';

// Main webgl classes
import '../modules/webgl/test';

// luma.gl core module: Test webgl-dependent code now
import '../modules/core/test/webgl-dependent-tests';

// luma.gl sub modules
import '../modules/addons/test/';
import '../modules/gpgpu/test/';
import '../modules/effects/test';
