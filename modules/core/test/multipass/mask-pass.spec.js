// import {_ClearMaskPass as ClearMaskPass} from '@luma.gl/core';
import {default as MaskPass} from '@luma.gl/core/multipass/clear-mask-pass';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('ClearMaskPass#constructor', t => {
  const {gl} = fixture;

  let mp = new MaskPass(gl);
  t.ok(mp instanceof MaskPass, 'should construct MaskPass object');

  mp = null;
  mp = new MaskPass(gl, {enable: false}, 'should construct MaskPass object with custom props');
  t.end();
});

test('ClearMaskPass#render', t => {
  const {gl} = fixture;

  const mp = new MaskPass(gl);

  t.doesNotThrow(() => mp._renderPass(gl), 'render should work');
  t.end();
});
