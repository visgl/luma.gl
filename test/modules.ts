// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import '@luma.gl/debug';

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '@luma.gl/shadertools/test';

// DEVICE INDEPENDENT TESTS
import '@luma.gl/api/test';
import '@luma.gl/api-tests/test';

// WEBGL ADAPTER TESTS
import '@luma.gl/webgl/test';
import '@luma.gl/debug/test';

// WEBGPU ADAPTER TESTS
import '@luma.gl/webgpu/test';

// CROSS-DEVICE TESTS
import '@luma.gl/engine/test';
// import '@luma.gl/experimental/test';

// DEPRECATED TESTS
import '@luma.gl/constants/test';
// import '@luma.gl/webgl-legacy/test';
