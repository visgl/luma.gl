import {_AnimationLoopProxy} from 'luma.gl';
import test from 'tape-catch';
// import {fixture} from 'luma.gl/test/setup';

test('WebGL#AnimationLoopProxy', t => {
  // const {gl} = fixture;
  t.ok(_AnimationLoopProxy);

  // const animationLoop = new _AnimationLoopProxy(gl).start().stop();
  // animationLoop.delete();
  t.end();
});
