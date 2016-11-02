import {createGLContext, Program} from '../../src/headless';
import {isWebGLContext} from '../../src/webgl/webgl-checks';
import shaders from '../../shaderlib';
import test from 'tape-catch';

test('WebGL#draw', t => {
  const gl = createGLContext();
  t.ok(isWebGLContext(gl), 'Created gl context');

  const program = new Program(gl, shaders);
  t.ok(program instanceof Program, 'Program construction successful');
  t.end();

  // draw(gl, {
  // instanced: true,
  // });
});
