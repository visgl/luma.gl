import {createGLContext} from 'luma.gl';
import {polyfillExtensions, TEST_EXPORTS} from '../../src/webgl/context-limits';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

test('WebGL#polyfillExtensions', t => {
  const {gl} = fixture;

  t.ok(polyfillExtensions === 'function', 'polyfillExtensions defined');

  const extensions = polyfillExtensions(gl);

  t.ok('limits' in info, 'info has limits');
  t.ok('caps' in info, 'info has caps');
  t.ok('info' in info, 'info has info');

  t.end();
});
