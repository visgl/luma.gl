// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import {loadWebGLDeveloperTools} from '@luma.gl/webgl';
await loadWebGLDeveloperTools();
// await loadWebGLDeveloperTools(); - Doesn't work in Node.js

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '../modules/shadertools/test';

import '../modules/api/test';

// WEBGL-DEPENDENT TESTS

// Generic webgl helper modules
import '../modules/constants/test';
import '../modules/debug/test';
import '../modules/webgl/test';

// DEVICE INDEPENDENT TESTS

// luma.gl core module: Test webgl-dependent code now
import '../modules/engine/test/';
import '../modules/experimental/test/';

// DEPRECATED TESTS
import '../modules/gltools/test';
