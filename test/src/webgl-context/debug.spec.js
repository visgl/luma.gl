import test from 'tape-catch';

import 'luma.gl/debug';

import {createGLContext, makeDebugContext} from 'luma.gl';

test('WebGL#makeDebugContext', t => {
  t.ok(typeof makeDebugContext === 'function', 'makeDebugContext defined');

  const context = makeDebugContext(createGLContext({}));
  t.ok(context, 'extensions were returned');
  t.end();
});
