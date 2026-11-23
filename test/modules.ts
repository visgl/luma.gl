// WEBGL-INDEPENDENT TESTS
// Imports tests for all modules that do not depend on WebGL

// Make sure the WebGL developer tools are pre-loaded. Test contexts are created synchronously
import {luma} from '@luma.gl/core';
luma.log.set('debug', true);

// Shaders is a GLSL textual processing library, no actual WebGL dependencies
import '@luma.gl/shaders/test';
import '@luma.gl/engine/test/effects';

// DEVICE INDEPENDENT TESTS
import '@luma.gl/core/test';
import '../modules/core/test/test-utils';

// WEBGL ADAPTER TESTS
import '../modules/core/test/webgl/index';

// WEBGPU ADAPTER TESTS
import '../modules/core/test/webgpu/index';

// CROSS-DEVICE TESTS
import '@luma.gl/engine/test';
import '@luma.gl/engine/test/gltf';

// EXPERIMENTAL
// Arrow adapter suites are included through their owning packages.
import '@deck.gl-community/arrow-layers/test';
import '@deck.gl-community/gpu-layers/test';
import '@luma.gl/graph/test';
import '@luma.gl/engine/test/splats';
import '@luma.gl/engine/test/text';
// DEPRECATED TESTS
import '../modules/core/test/webgl-constants/index';
