// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '../modules/shadertools/test';

import '../modules/api/test';

// WEBGL-DEPENDENT TESTS

// Import luma debug module to assist with debugging test failures
import '@luma.gl/debug';

// Generic webgl helper modules
import '../modules/constants/test';
import '../modules/gltools/test';
import '../modules/debug/test/';

// Main webgl classes
import '../modules/webgl/test';

// DEVICE INDEPENDENT TESTS

// luma.gl core module: Test webgl-dependent code now
import '../modules/engine/test/';
import '../modules/experimental/test/';
