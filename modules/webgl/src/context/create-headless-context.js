const ERR_HEADLESSGL_NOT_AVAILABLE =
  'Failed to create WebGL context in Node.js, headless gl not available';

const ERR_HEADLESSGL_FAILED =
  'Failed to create WebGL context in Node.js, headless gl returned null';

const ERR_HEADLESSGL_LOAD = `\
  luma.gl: loaded under Node.js without headless gl installed, meaning that WebGL \
  contexts can not be created. This may not be an error. For example, this is a \
  typical configuration for isorender applications running on the server.`;

// Create headless gl context (for running under Node.js)
export function createHeadlessContext(options) {
  const {width, height, webgl1, webgl2, onError} = options;
  if (webgl2 && !webgl1) {
    return onError('headless-gl does not support WebGL2');
  }
  if (!headlessGL) {
    return onError(ERR_HEADLESSGL_NOT_AVAILABLE);
  }
  const gl = headlessGL(width, height, options);
  if (!gl) {
    return onError(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}

// TODO(Tarek): OOGLY HACK to avoid webpack requiring headless
//   browser bundles. Will be removed in 8.0 when we
//   remove automatic headless context creation
// NOTE: Rollup does not process the line `const m = module;`
//   and writes it out verbatim in its final output, which ends
//   up falling over in browser environments at runtime. Added
//   a `try/catch` block to fix usage in rollup builds.
let m;
try {
  m = module;
} catch (e) {
  m = null;
}

// Load headless gl dynamically, if available
function headlessGL(...args) {
  const headless = m.require('gl');
  if (!headless) {
    throw new Error(ERR_HEADLESSGL_LOAD);
  }
  return headless(...args);
}
