// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import {luma} from '@luma.gl/core';
luma.log.set('debug', true);

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import '@luma.gl/shadertools/test';
import '@luma.gl/effects/test';

// DEVICE INDEPENDENT TESTS
import '@luma.gl/core/test';

// WEBGL ADAPTER TESTS
import '@luma.gl/webgl/test';

// WEBGPU ADAPTER TESTS
import '@luma.gl/webgpu/test';

// CROSS-DEVICE TESTS
import '@luma.gl/engine/test';
import '@luma.gl/gltf/test';
// import '@luma.gl/experimental/test';

// EXPERIMENTAL
import '@luma.gl/arrow/test';

// DEPRECATED TESTS
import '@luma.gl/constants/test';
