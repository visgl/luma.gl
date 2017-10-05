import {TransformFeedback} from 'luma.gl';
import 'luma.gl/headless';
import test from 'tape-catch';

import {fixture} from '../setup';

test('WebGL#TransformFeedback isSupported', t => {
  const {gl, gl2} = fixture;
  t.notok(TransformFeedback.isSupported(gl), 'isSupported returns correct result');
  t.is(TransformFeedback.isSupported(gl2), Boolean(gl2), 'isSupported returns correct result');
  t.end();
});

test('WebGL#TransformFeedback constructor/delete', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // t.throws(
  //   () => new TransformFeedback(),
  //   /.*WebGLRenderingContext.*/,
  //   'Buffer throws on missing gl context');

  const tf = new TransformFeedback(gl2, {});
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback construction successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback delete successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback repeated delete successful');

  t.end();
});
