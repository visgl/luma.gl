import {createGLContext, instrumentGLContext, isBrowser} from '@luma.gl/gltools';

const ERR_HEADLESSGL_FAILED =
  'Failed to create WebGL context in Node.js, headless gl returned null';

const ERR_HEADLESSGL_LOAD = `\
  luma.gl: loaded under Node.js without headless gl installed, meaning that WebGL \
  contexts can not be created. This may not be an error. For example, this is a \
  typical configuration for isorender applications running on the server.`;

const CONTEXT_DEFAULTS = {
  width: 1,
  height: 1,
  debug: true,
  throwOnError: false
};

export function createTestContext(opts = {}) {
  opts = Object.assign({}, CONTEXT_DEFAULTS, opts);
  const context = isBrowser
    ? createGLContext(opts)
    : instrumentGLContext(createHeadlessContext(opts), opts);
  return context;
}

// Create headless gl context (for running under Node.js)
export function createHeadlessContext(options) {
  const {width, height, webgl1, webgl2} = options;

  function onError(message) {
    if (options.throwOnError) {
      throw new Error(message);
    }
    return null;
  }

  if (webgl2 && !webgl1) {
    return onError('headless-gl does not support WebGL2');
  }
  const gl = headlessGL(width, height, options);
  if (!gl) {
    return onError(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}

// Load headless gl dynamically, if available
function headlessGL(...args) {
  const headless = module.require('gl');
  if (!headless) {
    throw new Error(ERR_HEADLESSGL_LOAD);
  }
  return headless(...args);
}
