import headlessGL from 'gl';

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

// Create headless gl context (for running under Node.js)
// Create headless gl context (for running under Node.js)
export function createHeadlessContext(options?: any): WebGLRenderingContext {
  options = {...CONTEXT_DEFAULTS, ...options};

  const {width, height, webgl1, webgl2} = options;

  if (webgl2 && !webgl1) {
    throw new Error('headless-gl does not support WebGL2');
  }
  if (!headlessGL) {
    throw new Error(ERR_HEADLESSGL_LOAD);
  }
  const gl = headlessGL(width, height, options);
  if (!gl) {
    throw new Error(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}
