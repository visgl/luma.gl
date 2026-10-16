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
import '@luma.gl/test-utils/test';

// WEBGL ADAPTER TESTS
import '../modules/core/test/webgl/index';

// WEBGPU ADAPTER TESTS
import '../modules/core/test/webgpu/index';

// CROSS-DEVICE TESTS
import '@luma.gl/engine/test';
import '@luma.gl/gltf/test';
import '@luma.gl/experimental/test';

// EXPERIMENTAL
import '@luma.gl/arrow/test';
import '@deck.gl-community/arrow-layers/test';
import '@deck.gl-community/gpu-layers/test';
import '@luma.gl/gpgpu/test';
import '@luma.gl/splats/test';
import '@luma.gl/text/test';
// DEPRECATED TESTS
import '../modules/core/test/webgl-constants/index';
