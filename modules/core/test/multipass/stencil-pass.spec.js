import {Model} from '@luma.gl/core';
import {default as StencilPass} from '@luma.gl/core/multipass/stencil-pass';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('StencilPass#constructor', t => {
  const {gl} = fixture;

  let rp = new StencilPass(gl);
  t.ok(rp instanceof StencilPass, 'should construct StencilPass object');

  rp = null;
  rp = new StencilPass(
    gl,
    {enable: false},
    'should construct StencilPass object with custom props'
  );
  t.end();
});

test('StencilPass#_renderPass', t => {
  const {gl} = fixture;

  const rp = new StencilPass(gl, {models: [new Model(gl)]});

  t.doesNotThrow(() => rp._renderPass({}), 'render should work');
  t.end();
});
