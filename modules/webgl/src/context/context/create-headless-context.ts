const ERR_HEADLESSGL_FAILED =
  'Failed to create WebGL context in Node.js, headless gl returned null';

const ERR_HEADLESSGL_LOAD = '\
  luma.gl: loaded under Node.js without headless gl installed, meaning that WebGL \
  contexts can not be created. This may not be an error. For example, this is a \
  typical configuration for isorender applications running on the server.';

const CONTEXT_DEFAULTS = {
  width: 1,
  height: 1,
  debug: true,
  throwOnError: false
};

/** Duck typing for the main headless gl export, a function to create contexts */
export type HeadlessGL = (width: number, height: number, options: Record<string, unknown>) => WebGLRenderingContext;

let headlessGL: HeadlessGL | null = null; 

/** By importing `gl` and registering it with this function, contexts can be created under Node.js */
export function registerHeadlessGL(headlessgl: HeadlessGL) {
  headlessGL = headlessgl;
}

/** @returns true if headless gl is registered */
export function isHeadlessGLRegistered(): boolean {
  return headlessGL !== null;
}

/** Create headless gl context (for running under Node.js) */
export function createHeadlessContext(options?: Record<string, any>): WebGLRenderingContext {
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
