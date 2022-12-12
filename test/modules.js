// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import '@luma.gl/debug';

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '../modules/shadertools/test';

// WEBGL-DEPENDENT TESTS

// Generic webgl helper modules

// DEVICE INDEPENDENT TESTS
import '../modules/api/test';
import '../modules/constants/test';

// WEBGL ADAPTER TESTS
import '../modules/webgl/test';
import '../modules/debug/test';

// WEBGPU ADAPTER TESTS
import '../modules/webgpu/test';

// CROSS-DEVICE TESTS
import '../modules/engine/test/';
import '../modules/experimental/test/';

// DEPRECATED TESTS
import '../modules/webgl-legacy/test';
