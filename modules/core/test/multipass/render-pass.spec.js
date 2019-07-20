import {_RenderPass as RenderPass, Model} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('RenderPass#constructor', t => {
  const {gl} = fixture;

  let rp = new RenderPass(gl);
  t.ok(rp instanceof RenderPass, 'should construct MaskPass object');

  rp = null;
  rp = new RenderPass(gl, {enable: false}, 'should construct MaskPass object with custom props');
  t.end();
});

test('RenderPass#_renderPass', t => {
  const {gl} = fixture;

  const rp = new RenderPass(gl, {models: [new Model(gl)]});

  t.doesNotThrow(() => rp._renderPass({}), 'render should work');
  t.end();
});
