// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

// helpers & utils
import './helpers/query-manager.spec';

// webgl
import './context.spec.js';
import './vertex-attributes.spec';
import './buffer.spec';
import './program.spec';
import './texture.spec';
import './framebuffer.spec';
import './renderbuffer.spec';
import './draw.spec';
import './uniforms.spec';

// Extensions
import './timer-query.spec';

// import './fbo-spec';

// webgl2
import './vertex-array-object.spec';
