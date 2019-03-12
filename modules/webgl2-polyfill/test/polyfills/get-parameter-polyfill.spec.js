import {getParameterPolyfill} from '@luma.gl/webgl2-polyfill/polyfills/get-parameter-polyfill';
import GL from '@luma.gl/constants';
import test from 'tape-catch';

import {fixture} from 'test/setup';

const WEBGL_PARAMETER_KEYS = [
  // WebGL2 context parameters
  GL.FRAGMENT_SHADER_DERIVATIVE_HINT,
  GL.RASTERIZER_DISCARD,
  GL.SAMPLES,
  // WebGL2 extension context parameters
  GL.GPU_DISJOINT_EXT,
  // Extension fixed values
  GL.UNMASKED_VENDOR_WEBGL,

  GL.UNMASKED_RENDERER_WEBGL,

  // Extension LIMITS
  GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT,

  // WebGL2 Limits
  GL.MAX_3D_TEXTURE_SIZE,
  GL.MAX_ARRAY_TEXTURE_LAYERS,
  GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL,
  GL.MAX_COLOR_ATTACHMENTS,
  GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS,
  GL.MAX_COMBINED_UNIFORM_BLOCKS,
  GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS,
  GL.MAX_DRAW_BUFFERS,
  GL.MAX_ELEMENT_INDEX,
  GL.MAX_ELEMENTS_INDICES,
  GL.MAX_ELEMENTS_VERTICES,
  GL.MAX_FRAGMENT_INPUT_COMPONENTS,
  GL.MAX_FRAGMENT_UNIFORM_BLOCKS,
  GL.MAX_FRAGMENT_UNIFORM_COMPONENTS,
  GL.MAX_SAMPLES,
  GL.MAX_SERVER_WAIT_TIMEOUT,
  GL.MAX_TEXTURE_LOD_BIAS,
  GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS,
  GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS,
  GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS,
  GL.MAX_UNIFORM_BLOCK_SIZE,
  GL.MAX_UNIFORM_BUFFER_BINDINGS,
  GL.MAX_VARYING_COMPONENTS,
  GL.MAX_VERTEX_OUTPUT_COMPONENTS,
  GL.MAX_VERTEX_UNIFORM_BLOCKS,
  GL.MAX_VERTEX_UNIFORM_COMPONENTS,
  GL.MIN_PROGRAM_TEXEL_OFFSET,
  GL.MAX_PROGRAM_TEXEL_OFFSET,
  GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT
];

test('getParameterPolyfill#import', t => {
  t.ok(typeof getParameterPolyfill === 'function', 'getParameterPolyfill imported OK');
  t.end();
});

test('getParameterPolyfill#WebGL1', t => {
  const {gl} = fixture;
  const originalGetParameterFunc = gl.getParameter.bind(gl);
  for (const pname of WEBGL_PARAMETER_KEYS) {
    const value = getParameterPolyfill(gl, originalGetParameterFunc, pname);
    t.ok(typeof value !== undefined, 'Returns valid value');
  }
  t.end();
});

test('getParameterPolyfill#WebGL2', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const originalGetParameterFunc = gl2.getParameter.bind(gl2);
  for (const pname of WEBGL_PARAMETER_KEYS) {
    const value = getParameterPolyfill(gl2, originalGetParameterFunc, pname);
    t.ok(typeof value !== undefined, 'Returns valid value');
  }
  t.end();
});
