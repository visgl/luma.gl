import {createGLContext} from 'luma.gl';
import {polyfillExtensions} from '../../src/webgl/context-extensions';
// import {polyfillExtensions, TEST_EXPORTS} from '../../src/webgl///';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

test('WebGL#polyfillExtensions', t => {
  const {gl} = fixture;

  t.ok(typeof polyfillExtensions === 'function', 'polyfillExtensions defined');

  const extensions = polyfillExtensions(gl);

  t.ok(extensions, 'extensions were returned');

  t.end();
});
