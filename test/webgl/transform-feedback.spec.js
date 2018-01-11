import {TransformFeedback, Buffer} from 'luma.gl';
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

  t.throws(
    () => new TransformFeedback(),
    (/.*Requires WebGL2.*/),
    'Buffer throws on missing gl context');

  const tf = new TransformFeedback(gl2);
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback construction successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback delete successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback repeated delete successful');

  t.end();
});

test('WebGL#TransformFeedback bindBuffers', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const tf = new TransformFeedback(gl2);
  const buffer1 = new Buffer(gl2);
  const buffer2 = new Buffer(gl2);

  tf.bindBuffers({
    0: buffer1,
    1: buffer2
  });
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers successful');

  tf.bindBuffers({
    0: buffer1,
    1: buffer2
  }, {clear: true});
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers with clear is successful');

  const varyingMap = {
    varying1: 0,
    varying2: 1
  };
  tf.bindBuffers({
    varying2: buffer2,
    varying1: buffer1
  }, {clear: true, varyingMap});

  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers with clear is successful');

  t.end();
});
