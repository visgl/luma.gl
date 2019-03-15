// Imports tests for all modules that do not depend on WebGL

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '../modules/shadertools/test';

// luma.gl core module: Test webgl-independent code, ensure webgl dependencies don't creep in
import '../modules/core/test/webgl-independent-tests';
