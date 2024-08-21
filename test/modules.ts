// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import {luma} from '@luma.gl/core';
luma.log.set('debug', true);

// Shadertypes is a WebGPU type string library, no actual WebGPU/WebGL dependencies
import '@luma.gl/shadertypes/test';

// Shadertools is a WGSL/GLSL textual processing library, no actual WebGPU/WebGL dependencies
import '@luma.gl/shadertools/test';

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

// DEPRECATED TESTS
import '@luma.gl/constants/test';
