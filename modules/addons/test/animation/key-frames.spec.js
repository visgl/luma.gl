import {KeyFrames} from '@luma.gl/addons';
import test from 'tape-catch';

test('Animation#KeyFrames', t => {
  const keyFrames = new KeyFrames([
    [0, {val1: [1, 0, 1], val2: 0}],
    [500, {val1: [1, 1, 1], val2: 2}],
    [800, {val1: [0, 0, 1], val2: 1}],
    [1200, {val1: [0, 1, 0], val2: 4}],
    [1500, {val1: [1, 0, 1], val2: 5}]
  ]);

  t.equals(keyFrames.startIndex, 0, 'start index set properly on initialization');
  t.equals(keyFrames.endIndex, 1, 'end index set properly on initialization');
  t.equals(keyFrames.factor, 0, 'factor set properly on initialization');
  t.equals(keyFrames.getStartTime(), 0, 'start time set properly on initialization');
  t.equals(keyFrames.getEndTime(), 500, 'end time set properly on initialization');
  t.equals(keyFrames.getStartData().val2, 0, 'start data set properly on initialization');
  t.equals(keyFrames.getEndData().val2, 2, 'end data set properly on initialization');

  keyFrames.setTime(250);

  t.equals(keyFrames.startIndex, 0, 'start index set properly after time set in first frame');
  t.equals(keyFrames.endIndex, 1, 'end index set properly after time set in first frame');
  t.equals(keyFrames.factor, 0.5, 'factor set properly after time set in first frame');
  t.equals(keyFrames.getStartTime(), 0, 'start time set properly after time set in first frame');
  t.equals(keyFrames.getEndTime(), 500, 'end time set properly after time set in first frame');
  t.equals(
    keyFrames.getStartData().val2,
    0,
    'start data set properly after time set in first frame'
  );
  t.equals(keyFrames.getEndData().val2, 2, 'end data set properly after time set in first frame');

  keyFrames.setTime(1000);

  t.equals(keyFrames.startIndex, 2, 'start index set properly after time set to interior frame');
  t.equals(keyFrames.endIndex, 3, 'end index set properly after time set to interior frame');
  t.equals(keyFrames.factor, 0.5, 'factor set properly after time set to interior frame');
  t.equals(
    keyFrames.getStartTime(),
    800,
    'start time set properly after time set to interior frame'
  );
  t.equals(keyFrames.getEndTime(), 1200, 'end time set properly after time set to interior frame');
  t.equals(
    keyFrames.getStartData().val2,
    1,
    'start data set properly after time set to interior frame'
  );
  t.equals(
    keyFrames.getEndData().val2,
    4,
    'end data set properly after time set to interior frame'
  );

  keyFrames.setTime(1350);

  t.equals(keyFrames.startIndex, 3, 'start index set properly after time set to last');
  t.equals(keyFrames.endIndex, 4, 'end index set properly after time set to last');
  t.equals(keyFrames.factor, 0.5, 'factor set properly after time set to last');
  t.equals(keyFrames.getStartTime(), 1200, 'start time set properly after time set to last');
  t.equals(keyFrames.getEndTime(), 1500, 'end time set properly after time set to last');
  t.equals(keyFrames.getStartData().val2, 4, 'start data set properly after time set to last');
  t.equals(keyFrames.getEndData().val2, 5, 'end data set properly after time set to last');

  keyFrames.setTime(-1);

  t.equals(keyFrames.startIndex, 0, 'start index clamps at 0');
  t.equals(keyFrames.endIndex, 1, 'end index clamps at 1');
  t.equals(keyFrames.factor, 0, 'factor set properly when clamped at 0');

  keyFrames.setTime(2000);

  t.equals(keyFrames.startIndex, 3, 'start index clamps last frame');
  t.equals(keyFrames.endIndex, 4, 'end index clamps at last frame');
  t.equals(keyFrames.factor, 1, 'factor set properly when clamped at last frame');

  t.end();
});
