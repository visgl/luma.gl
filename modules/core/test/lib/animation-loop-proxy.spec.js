import {_AnimationLoopProxy} from '@luma.gl/core';
import test from 'tape-catch';
// import {fixture} from 'test/setup';

test('core#AnimationLoopProxy', t => {
  // const {gl} = fixture;
  t.ok(_AnimationLoopProxy);

  // const animationLoop = new _AnimationLoopProxy(gl).start().stop();
  // animationLoop.delete();
  t.end();
});
