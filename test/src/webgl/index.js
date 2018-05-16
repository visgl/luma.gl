// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

// webgl
import './attribute.spec';
import './buffer.spec';
import './vertex-array.spec';
import './uniforms.spec';

import './texture.spec';
import './renderbuffer.spec';
import './framebuffer.spec';

import './draw.spec';
import './program.spec';
import './sampler.spec';
import './uniform-buffer-layout.spec';

// Extensions / webgl2
// import './query.spec'; // TODO - Chrome has disabled...
import './transform-feedback.spec';
