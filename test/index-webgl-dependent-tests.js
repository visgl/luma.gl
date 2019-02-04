// Imports tests for all modules that depend on webgl

import '@luma.gl/debug';

// Modules that include their own tests
import '@luma.gl/webgl2-polyfill/../test';

// Cherry-pick webgl-dependent core directories
import './modules/core/webgl-context';
import './modules/core/webgl';
import './modules/core/core';

import './modules/gpgpu';
