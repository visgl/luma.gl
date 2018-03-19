import polyfillContext from 'luma.gl/webgl-utils/polyfill-context';
// import {polyfillContext, TEST_EXPORTS} from 'luma.gl/webgl';
import test from 'tape-catch';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#polyfillContext', t => {
  const {gl, gl2} = fixture;

  t.ok(typeof polyfillContext === 'function', 'polyfillContext defined');

  const extensions = polyfillContext(gl);
  t.ok(extensions, 'extensions were returned');

  if (gl2) {
    const extensions2 = polyfillContext(gl2);
    t.ok(extensions2, 'extensions were returned');
  }

  t.end();
});
