import {Timeline} from '@luma.gl/core';
import test from 'tape-catch';

// NOTE(Tarek): This is for the x * CHANNEL1_RATE
// lines, which are important for clarity.
/* eslint-disable no-implicit-coercion */
test('Animation#Timeline', t => {
  const timeline = new Timeline();
  timeline.pause();
  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  const CHANNEL1_RATE = 2;
  const CHANNEL2_RATE = 3;
  const channel1 = timeline.addChannel({
    rate: CHANNEL1_RATE,
    delay: 2,
    duration: 4,
    repeat: 1
  });
  const channel2 = timeline.addChannel({
    rate: CHANNEL2_RATE,
    delay: 3,
    duration: 3,
    repeat: 2
  });
  t.is(timeline.getTime(channel1), 0 * CHANNEL1_RATE, 'Channel 1 initialized');
  t.is(timeline.getTime(channel2), 0 * CHANNEL2_RATE, 'Channel 2 initialized');

  timeline.setTime(1);
  t.is(timeline.getTime(), 1, 'Timeline was set');
  t.is(
    timeline.getTime(channel1),
    0 * CHANNEL1_RATE,
    'Channel 1 time does not elapse before delay'
  );
  t.is(
    timeline.getTime(channel2),
    0 * CHANNEL2_RATE,
    'Channel 2 time does not elapse before delay'
  );

  timeline.setTime(4);
  t.is(timeline.getTime(channel1), 2 * CHANNEL1_RATE, 'Channel 1 set');
  t.is(timeline.getTime(channel2), 1 * CHANNEL2_RATE, 'Channel 2 set');

  timeline.setTime(7);
  t.is(timeline.getTime(channel1), 4 * CHANNEL1_RATE, 'Channel 1 does not loop');
  t.is(timeline.getTime(channel2), 1 * CHANNEL2_RATE, 'Channel 2 looped once');

  timeline.setTime(10);
  t.is(timeline.getTime(channel1), 4 * CHANNEL1_RATE, 'Channel 1 does not loop');
  t.is(timeline.getTime(channel2), 3 * CHANNEL2_RATE, 'Channel 2 only looped once');

  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  timeline.play();
  timeline.update(4);
  timeline.update(8);
  t.is(timeline.getTime(), 4, 'Timeline was set on update while playing');
  t.is(timeline.getTime(channel1), 2 * CHANNEL1_RATE, 'Channel 1 was set on update while playing');
  t.is(timeline.getTime(channel2), 1 * CHANNEL2_RATE, 'Channel 2 was set on update while playing');

  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  timeline.pause();
  timeline.update(4);
  timeline.update(8);
  t.is(timeline.getTime(), 0, 'Timeline was not set on update while paused');
  t.is(
    timeline.getTime(channel1),
    0 * CHANNEL1_RATE,
    'Channel 1 was not set on update while paused'
  );
  t.is(
    timeline.getTime(channel2),
    0 * CHANNEL2_RATE,
    'Channel 2 was not set on update while paused'
  );

  timeline.removeChannel(channel1);
  t.is(timeline.getTime(channel1), -1, 'Channel 1 was deleted');
  t.end();
});
