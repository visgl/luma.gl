// Imports tests for all modules that depend on webgl

import 'luma.gl/debug';
import '../modules/core/src/shadertools/test'; // TODO: move these tests into modules/core/shadertools
import './modules/core/webgl1';
import './modules/core/webgl-utils';
import './modules/core/webgl-context';
import './modules/core/webgl';
import './modules/core/core';
import './modules/core/shadertools';
