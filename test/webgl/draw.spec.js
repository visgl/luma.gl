import test from 'tape-catch';
import {createGLContext, Program, isWebGLContext} from '../../headless';
import {SHADERS} from '../../experimental';

test('WebGL#draw', t => {
  const gl = createGLContext();
  t.ok(isWebGLContext(gl), 'Created gl context');

  const program = new Program(gl, SHADERS);
  t.ok(program instanceof Program, 'Program construction successful');
  t.end();

  // draw(gl, {
  // instanced: true,
  // });
});
