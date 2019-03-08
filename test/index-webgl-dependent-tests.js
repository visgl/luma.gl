// Imports tests for all modules that depend on webgl

import '@luma.gl/debug';

// Modules that include their own tests
import '../modules/webgl2-polyfill/test';
import '../modules/webgl-state-tracker/test';

// Cherry-pick webgl-dependent core directories
import './modules/core/webgl';
import './modules/core/core';
import './modules/gpgpu';

import '../modules//effects/test';

// The classic luma.gl module - Supported for backwards compatibility
import '../modules/main/test';
