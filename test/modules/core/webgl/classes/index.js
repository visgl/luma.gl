// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

// helpers
import './accessor.spec';

// webgl
import './buffer.spec';
import './vertex-array-object.spec';
import './vertex-array.spec';
import './uniforms.spec';

import './texture.spec';
import './texture-2d.spec';

import './renderbuffer.spec';
import './framebuffer.spec';

import './program.spec';
import './program-configuration.spec';
import './draw.spec';

import './copy-and-blit.spec.js';

// Extensions / webgl2
import './query.spec'; // TODO - Chrome has re-enabled...

// webgl2
import './sampler.spec';
import './uniform-buffer-layout.spec';
import './transform-feedback.spec';

/*
UNUSED SPECS:
texture-2d-array.spec
texture-3d.spec
*/
