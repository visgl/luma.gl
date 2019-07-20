// import {_ClearMaskPass as ClearMaskPass} from '@luma.gl/core';
import {default as ClearMaskPass} from '@luma.gl/core/multipass/clear-mask-pass';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('ClearMaskPass#constructor', t => {
  const {gl} = fixture;

  let cms = new ClearMaskPass(gl);
  t.ok(cms instanceof ClearMaskPass, 'should construct ClearMaskPass object');

  cms = null;
  cms = new ClearMaskPass(
    gl,
    {enable: false},
    'should construct ClearMaskPass object with custom props'
  );
  t.end();
});

test('ClearMaskPass#render', t => {
  const {gl} = fixture;

  const cms = new ClearMaskPass(gl);

  t.doesNotThrow(() => cms.render(gl), 'render should work');
  t.end();
});
