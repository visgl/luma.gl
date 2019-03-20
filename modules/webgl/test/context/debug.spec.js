import test from 'tape-catch';

import {createGLContext} from '@luma.gl/webgl';
import {makeDebugContext} from '@luma.gl/debug';

test('WebGL#makeDebugContext', t => {
  t.ok(typeof makeDebugContext === 'function', 'makeDebugContext defined');

  const context = makeDebugContext(createGLContext({}));
  t.ok(context, 'extensions were returned');
  t.end();
});
