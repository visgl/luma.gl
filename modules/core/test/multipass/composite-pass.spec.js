import {_CompositePass as CompositePass, _Pass as Pass} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('CompositePass#constructor', t => {
  const {gl} = fixture;
  let cp = new CompositePass(gl);
  t.ok(cp instanceof CompositePass, 'should construct CompositePass object');

  cp = null;
  cp = new CompositePass(gl, [new Pass(gl)]);
  t.ok(cp instanceof CompositePass, 'should construct CompositePass object');
  t.end();
});

test('CompositePass#render', t => {
  const {gl} = fixture;
  const cp = new CompositePass(gl, [new Pass(gl, {enabled: false})]);
  t.doesNotThrow(() => cp.render(), 'render should work');
  t.end();
});
