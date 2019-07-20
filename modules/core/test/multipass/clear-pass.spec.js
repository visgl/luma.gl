// import {Model} from '@luma.gl/core';
import {_ClearPass as ClearPass} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('ClearPass#constructor', t => {
  const {gl} = fixture;

  let cp = new ClearPass(gl);
  t.ok(cp instanceof ClearPass, 'should construct TexturePass object');

  cp = null;
  cp = new ClearPass(gl, {enable: false}, 'should construct TexturePass object with custom props');
  t.end();
});

test('ClearPass#_renderPass', t => {
  const {gl} = fixture;

  const cp = new ClearPass(gl);

  t.doesNotThrow(() => cp._renderPass({}), 'render should work');
  t.end();
});
