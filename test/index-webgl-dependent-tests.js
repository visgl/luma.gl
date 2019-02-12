// Imports tests for all modules that depend on webgl

import '@luma.gl/debug';

// Modules that include their own tests
import '@luma.gl/webgl2-polyfill/../test';
import '@luma.gl/webgl-state-tracker/../test';

// Cherry-pick webgl-dependent core directories
import './modules/core/webgl';
import './modules/core/core';
import './modules/gpgpu';

import '@luma.gl/effects/../test';

// The classic luma.gl module - Supported for backwards compatibility
import 'luma.gl/../test';
