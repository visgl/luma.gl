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
import './renderbuffer.spec';
import './framebuffer.spec';

import './program.spec';
import './program-configuration.spec';
import './draw.spec';

// Extensions / webgl2
// import './query.spec'; // TODO - Chrome has disabled...

// webgl2
import './sampler.spec';
import './uniform-buffer-layout.spec';
import './transform-feedback.spec';
