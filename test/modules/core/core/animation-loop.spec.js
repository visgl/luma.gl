import {AnimationLoop} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

test('WebGL#AnimationLoop constructor', t => {
  t.ok(AnimationLoop);

  // const {gl} = fixture;
  // const animationLoop = new AnimationLoop(gl).start().stop();
  // t.ok(animationLoop);
  // animationLoop.delete();
  t.end();
});
