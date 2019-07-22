import {_MultiPassRenderer as MultiPassRenderer, _Pass as Pass} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('MultiPassRenderer#constructor', t => {
  const {gl2} = fixture;

  if (!gl2) {
    // RenderState is creating Framebuffer with depth/stencil attachment (requires FEATURES.TEXTURE_DEPTH)
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let mPass = new MultiPassRenderer(gl2);
  t.ok(mPass instanceof MultiPassRenderer, 'should construct MultiPassRenderer object');

  mPass = null;
  mPass = new MultiPassRenderer(gl2, [new Pass(gl2), new Pass(gl2)]);
  t.end();
});
