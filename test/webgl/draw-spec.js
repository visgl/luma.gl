import {isWebGLRenderingContext} from '../../src/webgl/webgl-checks';

import {createGLContext, Program} from '../../src/webgl';
import shaders from '../../shaderlib';

import test from 'tape-catch';
import headlessGL from 'gl';

test('WebGL#draw', t => {
  const gl = createGLContext({headlessGL});
  t.ok(isWebGLRenderingContext(gl), 'Created gl context');

  const program = new Program(gl, shaders);
  t.ok(program instanceof Program, 'Program construction successful');
  t.end();

  // draw(gl, {
  // instanced: true,
  // });
});
