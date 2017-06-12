import {GL, createGLContext} from 'luma.gl';
import trackContext from '../../src/webgl-utils/track-context';
// import {trackContext, TEST_EXPORTS} from '../../src/webgl///';
// import {getParameter, setParameter, withParameters, resetParameters} from 'luma.gl';

import test from 'tape-catch';

// Settings test, don't reuse a context
const fixture = {
  gl: createGLContext()
};

import GL_PARAMETERS from '../../src/webgl/api/parameters';

// eslint-disable-next-line
const SETTINGS = {
  blend: false,
  blendColor: [0, 0, 0, 0],
  blendEquation: [GL.FUNC_ADD, GL.FUNC_ADD], // [GL.BLEND_EQUATION_RGB, GL.BLEND_EQUATION_ALPHA],
  blendFunc: [GL.ONE, GL.ZERO, GL.ONE, GL.ZERO],

  clearColor: [0, 0, 0, 0],
  colorMask: [true, true, true, true],
  // colorWritemask: ,

  cullFace: false,
  cullFaceMode: GL.BACK,

  depthTest: false,
  depthClearValue: 1,
  depthFunc: GL.LESS,
  depthRange: [0, 1],
  depthWritemask: true,

  dither: true,

  frontFace: GL.CCW,

  generateMipmapHint: GL.DONT_CARE,

  lineWidth: 1,

  polygonOffsetFill: false,
  polygonOffset: [0, 0],

  // sampleCoverage: GL.SAMPLE_COVERAGE,

  scissorTest: false,
  scissorBox: [0, 0, 1024, 1024],

  stencilTest: false,
  stencilClearValue: 0,
  stencilMask: [0xFFFFFFFF, 0xFFFFFFFF],
  stencilFunc: [GL.ALWAYS, 0, 0xFFFFFFFF, GL.ALWAYS, 0, 0xFFFFFFFF],
  stencilOp: [GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP],

  viewport: [0, 0, 1024, 1024],

  [GL.PACK_ALIGNMENT]: 4,
  [GL.UNPACK_ALIGNMENT]: 4,
  [GL.UNPACK_FLIP_Y_WEBGL]: false,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.BROWSER_DEFAULT_WEBGL

  // WEBGL2 PIXEL PACK/UNPACK MODES

  // [GL.PACK_ROW_LENGTH]: 0,
  // [GL.PACK_SKIP_PIXELS]: 0,
  // [GL.PACK_SKIP_ROWS]: 0,
  // [GL.UNPACK_ROW_LENGTH]: 0,
  // [GL.UNPACK_IMAGE_HEIGHT]: 0,
  // [GL.UNPACK_SKIP_PIXELS]: 0,
  // [GL.UNPACK_SKIP_ROWS]: 0,
  // [GL.UNPACK_SKIP_IMAGES]: 0
};

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

test('WebGL#trackContext', t => {
  const {gl} = fixture;

  t.ok(typeof trackContext === 'function', 'trackContext defined');

  t.doesNotThrow(
    () => trackContext(gl),
    'trackContext call succeeded'
  );

  // if (gl2) {
  //   const extensions2 = trackContext(gl2);
  //   t.ok(extensions2, 'extensions were returned');
  // }

  t.ok(GL_PARAMETERS, 'TEST_EXPORTS ok');

  t.end();
});

/*
test('WebGLState#getParameter', t => {
  const {gl} = fixture;
  for (const setting in GL_PARAMETERS) {
    if (!GL_PARAMETERS[setting].webgl2) {
      const value = getParameter(gl, setting);
      t.ok(value !== undefined,
        `${setting}: got a value ${stringifyTypedArray(value)}`);
    }
  }
  t.end();
});

test('WebGLState#getParameter (WebGL2)', t => {
  const {gl} = fixture;
  if (isWebGL2Context(gl)) {
    for (const setting in GL_PARAMETERS) {
      if (GL_PARAMETERS[setting].webgl2) {
        const value = getParameter(gl, setting);
        t.ok(value !== undefined,
          `${setting}: got a value ${stringifyTypedArray(value)}`);
      }
    }
  }
  t.end();
});
*/

test('WebGLState#set and get', t => {
  const {gl} = fixture;

  t.doesNotThrow(
    () => trackContext(gl),
    'trackContext call succeeded'
  );

  let value = gl.getParameter(GL.COLOR_CLEAR_VALUE);
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  gl.clearColor(0, 1, 0, 1);

  value = gl.getParameter(GL.COLOR_CLEAR_VALUE);
  t.deepEqual(value, [0, 1, 0, 1],
    `got expected value ${stringifyTypedArray(value)}`);

  t.doesNotThrow(
    () => trackContext(gl),
    'trackContext call succeeded'
  );

  // setDefaults(gl);

  value = gl.getParameter(GL.COLOR_CLEAR_VALUE);
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});

/*
test('WebGLState#resetParameters', t => {
  const {gl} = fixture;

  t.doesNotThrow(
    () => trackContext(gl),
    'trackContext call succeeded'
  );

  setParameter(gl, 'clearColor', [0, 1, 0, 1]);

  let value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 1, 0, 1],
    `got expected value ${stringifyTypedArray(value)}`);

  resetParameters(gl);

  value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});
*/
