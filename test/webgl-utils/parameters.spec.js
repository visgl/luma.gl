import {createTestContext} from '../setup';
import {GL} from 'luma.gl';
import {glSetParameters, glGetParameter, glCopyParameters, GL_PARAMETER_DEFAULTS}
  from '../../src/webgl-utils/parameters';
import trackContext from '../../src/webgl-utils/track-context';
import test from 'tape-catch';

// Settings test, don't reuse a context
const fixture = {
  gl: createTestContext({debug: true})
};

// eslint-disable-next-line
const GL_PARAMETER_SETTINGS_ONE = {
  [GL.BLEND]: true,
  [GL.BLEND_COLOR]: new Float32Array([0.5, 0.5, 0.5, 0]),
  [GL.BLEND_EQUATION_RGB]: GL.FUNC_SUBTRACT,
  [GL.BLEND_EQUATION_ALPHA]: GL.MIN,
  [GL.BLEND_SRC_RGB]: GL.SRC_COLOR,
  [GL.BLEND_DST_RGB]: GL.DST_COLOR,
  [GL.BLEND_SRC_ALPHA]: GL.SRC_ALPHA,
  [GL.BLEND_DST_ALPHA]: GL.DST_ALPHA,
  [GL.COLOR_CLEAR_VALUE]: new Float32Array([0.5, 0.5, 0.5, 0]), // TBD
  [GL.COLOR_WRITEMASK]: [false, false, false, true],
  [GL.CULL_FACE]: true,
  [GL.CULL_FACE_MODE]: GL.FRONT,
  [GL.DEPTH_TEST]: true,
  [GL.DEPTH_CLEAR_VALUE]: 0,
  [GL.DEPTH_FUNC]: GL.NEVER,
  [GL.DEPTH_RANGE]: new Float32Array([0.5, 1]), // TBD
  [GL.DEPTH_WRITEMASK]: false,
  [GL.DITHER]: false,
  [GL.FRONT_FACE]: GL.CW,
  [GL.GENERATE_MIPMAP_HINT]: GL.FASTEST,
  [GL.LINE_WIDTH]: 2,
  [GL.POLYGON_OFFSET_FILL]: true,
  [GL.POLYGON_OFFSET_FACTOR]: 1,
  [GL.POLYGON_OFFSET_UNITS]: 1,
  [GL.SAMPLE_COVERAGE_VALUE]: 0,
  [GL.SAMPLE_COVERAGE_INVERT]: true,
  [GL.SCISSOR_TEST]: true,
  // Note: Dynamic value. If scissor test enabled we expect users to set correct scissor box
  [GL.SCISSOR_BOX]: new Int32Array([0, 0, 100, 100]),
  [GL.STENCIL_TEST]: true,
  [GL.STENCIL_CLEAR_VALUE]: 0.5,
  [GL.STENCIL_WRITEMASK]: 0xCCCCCCCC,
  [GL.STENCIL_BACK_WRITEMASK]: 0xDDDDDDDD,
  [GL.STENCIL_FUNC]: GL.NEVER,
  [GL.STENCIL_REF]: 0.5,
  [GL.STENCIL_VALUE_MASK]: 0xBBBBBBBB,
  [GL.STENCIL_BACK_FUNC]: GL.LEQUAL,
  [GL.STENCIL_BACK_REF]: 0.5,
  [GL.STENCIL_BACK_VALUE_MASK]: 0x11111111,
  [GL.STENCIL_FAIL]: GL.REPLACE,
  [GL.STENCIL_PASS_DEPTH_FAIL]: GL.INCR,
  [GL.STENCIL_PASS_DEPTH_PASS]: GL.DECR,
  [GL.STENCIL_BACK_FAIL]: GL.REPLACE,
  [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: GL.INCR,
  [GL.STENCIL_BACK_PASS_DEPTH_PASS]: GL.DECR,
  // Dynamic value: We use [0, 0, 1024, 1024] as default, but usually this is updated in each frame.
  [GL.VIEWPORT]: new Int32Array([0, 0, 100, 100]),
  // WEBGL1 PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]: 8,
  [GL.UNPACK_ALIGNMENT]: 16,
  [GL.UNPACK_FLIP_Y_WEBGL]: true,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: true,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.NONE,

  // WEBGL2 / EXTENSIONS
  // gl1: 'OES_standard_derivatives'
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]: GL.FASTEST,
  // RASTERIZER_DISCARD ...
  [GL.PACK_ROW_LENGTH]: 2,
  [GL.PACK_SKIP_PIXELS]: 4,
  [GL.PACK_SKIP_ROWS]: 8,
  [GL.UNPACK_ROW_LENGTH]: 16,
  [GL.UNPACK_IMAGE_HEIGHT]: 32,
  [GL.UNPACK_SKIP_PIXELS]: 64,
  [GL.UNPACK_SKIP_ROWS]: 128,
  [GL.UNPACK_SKIP_IMAGES]: 512
};

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

test('WebGL#set and get', t => {
  const {gl} = fixture;
  const values = {
    [GL.CULL_FACE]: true
  };
  let value = glGetParameter(gl, GL.CULL_FACE);
  t.deepEqual(value, false,
    `got expected value ${stringifyTypedArray(value)}`);
  glSetParameters(gl, values, {});
  value = glGetParameter(gl, GL.CULL_FACE);
  t.deepEqual(value, true,
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});

test('WebGL#composite setter', t => {
  const {gl} = fixture;
  const compositeStateKeys = [
    GL.STENCIL_FUNC,
    GL.STENCIL_REF,
    GL.STENCIL_VALUE_MASK
  ];
  const partialCompositeStateValues = {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  };

  t.doesNotThrow(
    () => trackContext(gl, {copyState: false}),
    'trackContext call succeeded'
  );

  // Verify default values.
  for (const key of compositeStateKeys) {
    const value = glGetParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`);
  }

  // Update only two states out of three.
  glSetParameters(gl, partialCompositeStateValues, GL_PARAMETER_DEFAULTS);

  let value = glGetParameter(gl, GL.STENCIL_FUNC);
  t.deepEqual(value, partialCompositeStateValues[GL.STENCIL_FUNC],
    `got expected updated value ${stringifyTypedArray(value)}`);
  value = glGetParameter(gl, GL.STENCIL_REF);
  t.deepEqual(value, partialCompositeStateValues[GL.STENCIL_REF],
    `got expected updated value ${stringifyTypedArray(value)}`);
  value = glGetParameter(gl, GL.STENCIL_VALUE_MASK);
  t.deepEqual(value, GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`);

  t.end();
});

test('WebGLState#copyParameters', t => {
  const {gl} = fixture;

  t.doesNotThrow(
    () => trackContext(gl, {copyState: false}),
    'trackContext call succeeded'
  );

  // Set custom values.
  glSetParameters(gl, GL_PARAMETER_SETTINGS_ONE, {});
  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    const value = glGetParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_SETTINGS_ONE[key],
      `got expected value ${stringifyTypedArray(value)}`);
  }

  const copy = glCopyParameters(gl);
  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    const value = copy[key];
    t.deepEqual(value, GL_PARAMETER_SETTINGS_ONE[key],
      `got expected value ${stringifyTypedArray(value)}`);
  }

  t.end();
});
