// import {Model} from '@luma.gl/core';
import {default as TexturePass} from '@luma.gl/core/multipass/texture-pass';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('TexturePass#constructor', t => {
  const {gl} = fixture;

  let tp = new TexturePass(gl);
  t.ok(tp instanceof TexturePass, 'should construct TexturePass object');

  tp = null;
  tp = new TexturePass(
    gl,
    {enable: false},
    'should construct TexturePass object with custom props'
  );
  t.end();
});

test('TexturePass#_renderPass', t => {
  const {gl} = fixture;

  const tp = new TexturePass(gl);

  t.doesNotThrow(() => tp._renderPass({}), 'render should work');
  t.end();
});
