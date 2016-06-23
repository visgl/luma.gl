/* eslint-disable max-len */
import {WebGL2RenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, VertexAttributes} from '../../src/webgl';
import test from 'tape-catch';

test('WebGL#VertexAttributes#enable', t => {
  const gl = createGLContext();

  const MAX_ATTRIBUTES = VertexAttributes.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'VertexAttributes.getMaxAttributes() >= 8');

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(VertexAttributes.isEnabled(gl, i), false, `vertex attribute ${i} should initially be disabled`);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    VertexAttributes.enable(gl, i);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(VertexAttributes.isEnabled(gl, i), true, `vertex attribute ${i} should now be enabled`);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    VertexAttributes.disable(gl, i);
  }

  t.equal(VertexAttributes.isEnabled(gl, 0), true, `vertex attribute 0 should **NOT** be disabled`);
  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    t.equal(VertexAttributes.isEnabled(gl, i), false, `vertex attribute ${i} should now be disabled`);
  }

  t.end();
});

test('WebGL#VertexAttributes#WebGL2 support', t => {
  const gl = createGLContext({webgl2: true});

  if (!(gl instanceof WebGL2RenderingContext)) {
    t.comment('- WebGL2 NOT ENABLED: skipping tests');
    t.end();
    return;
  }
  const MAX_ATTRIBUTES = VertexAttributes.getMaxAttributes(gl);

  t.ok(MAX_ATTRIBUTES >= 8, 'VertexAttributes.getMaxAttributes() >= 8');

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(VertexAttributes.wegl2getDivisor(gl, i), 0, `vertex attribute ${i} should have 0 divisor`);
  }

  t.end();
});
