// luma.gl, MIT license
import { WebGLLimits } from '@luma.gl/webgl';
import {getKey, getContextInfo} from '@luma.gl/webgl-legacy';
import GL from '@luma.gl/constants';
import test from 'tape-promise/tape';

import {fixture} from 'test/setup';

/** WebGL context limits */
export const WEBGL_LIMITS: Partial<Record<keyof WebGLLimits, boolean>> = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: false,
  [GL.ALIASED_POINT_SIZE_RANGE]: false,
  [GL.MAX_TEXTURE_SIZE]: true,
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: true,
  [GL.MAX_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_RENDERBUFFER_SIZE]: true,
  [GL.MAX_VARYING_VECTORS]: true,
  [GL.MAX_VERTEX_ATTRIBS]: true,
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: true,
  [GL.MAX_VIEWPORT_DIMS]: false,

  // Extensions
  // [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: true,

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: true,
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: true,
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: true,
  [GL.MAX_COLOR_ATTACHMENTS]: true,
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: true,
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: true,
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: true,
  [GL.MAX_DRAW_BUFFERS]: true,
  [GL.MAX_ELEMENT_INDEX]: true,
  [GL.MAX_ELEMENTS_INDICES]: true,
  [GL.MAX_ELEMENTS_VERTICES]: true,
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: true,
  [GL.MAX_SAMPLES]: true,
  [GL.MAX_SERVER_WAIT_TIMEOUT]: true,
  [GL.MAX_TEXTURE_LOD_BIAS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: true,
  [GL.MAX_UNIFORM_BLOCK_SIZE]: true,
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: true,
  [GL.MAX_VARYING_COMPONENTS]: true,
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: true,
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: true,
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: true,
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: true,
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: true,
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: true
};

test('WebGL#getContextInfo', (t) => {
  const {gl} = fixture;

  t.ok(getContextInfo, 'getContextInfo defined');

  const info = getContextInfo(gl);

  t.ok('limits' in info, 'info has limits');
  t.ok('info' in info, 'info has info');

  t.end();
});

test('WebGL1#getContextInfo#limits', (t) => {
  const {gl} = fixture;

  const info = getContextInfo(gl);

  for (const limit in WEBGL_LIMITS) {
    const actual = info.limits[limit];
    t.ok(actual !== undefined, `${getKey(gl, Number(limit) as GL)}: limit ${actual}`);
  }

  t.end();
});

test('WebGL2#getContextInfo#limits', (t) => {
  const {gl2} = fixture;

  if (gl2) {
    const info = getContextInfo(gl2);

    for (const limit in WEBGL_LIMITS) {
      const actual = info.limits[limit];
      t.ok(actual !== undefined, `${getKey(gl2, limit)}: limit ${actual}`);
    }
  }

  t.end();
});
