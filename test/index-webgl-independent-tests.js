// Imports tests for all modules that do not depend on WebGL

// Constants module should be webgl-independent, obviously
import './modules/constants';

// Cherry-pick webgl-dependent core modules
import './modules/core/utils';
import './modules/core/geometry';

// Shadertools is a GLSL textual processing library, no actual WebGL dependencies
import './modules/shadertools';
