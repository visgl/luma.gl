/* global document, setTimeout */
import {AnimationLoop} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('core#AnimationLoop constructor', t => {
  t.ok(AnimationLoop, 'AnimationLoop imported');

  const {gl} = fixture;
  const animationLoop = new AnimationLoop({gl});
  t.ok(animationLoop, 'AnimationLoop constructor should not throw');
  t.end();
});

test('core#AnimationLoop start,stop', t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let initializeCalled = 0;
  let renderCalled = 0;
  let finalizeCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onInitialize: () => {
      initializeCalled++;
    },
    onRender: () => {
      renderCalled++;

      animationLoop.stop();

      t.is(initializeCalled, 1, 'onInitialize called');
      t.is(renderCalled, 1, 'onRender called');
      t.is(finalizeCalled, 1, 'onFinalize called');

      t.end();
    },
    onFinalize: () => {
      finalizeCalled++;
    }
  }).start();
});

test('core#AnimationLoop redraw', t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let renderCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onInitialize: () => {
      animationLoop.redraw();
      animationLoop.stop();

      t.is(renderCalled, 1, 'onRender called');

      t.end();
    },
    onRender: () => {
      renderCalled++;
    }
  }).start();
});

test('core#AnimationLoop should not call initialize more than once', async t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onInitialize: () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  animationLoop.start();
  await animationLoop.waitForRender();
  animationLoop.stop();
  t.is(initializeCalled, 1, 'onInitialize called');
  t.end();
});

test('core#AnimationLoop two start()s should only run one loop', async t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let renderCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onRender: () => {
      renderCalled++;
    }
  });
  animationLoop.start();
  await animationLoop.waitForRender();
  animationLoop.start();
  await animationLoop.waitForRender();
  await animationLoop.waitForRender();
  animationLoop.stop();
  t.is(renderCalled, 3, 'onRender called');
  t.end();
});

test('core#AnimationLoop start followed immediately by stop() should stop', t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onInitialize: () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  animationLoop.stop();
  setTimeout(() => {
    t.is(initializeCalled, 0, 'onInitialize called');
    t.end();
  }, 100);
});

test('core#AnimationLoop a start/stop/start should not call initialize again', t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    gl,
    onInitialize: () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  setTimeout(() => animationLoop.stop(), 50);
  setTimeout(() => animationLoop.start(), 100);
  setTimeout(() => {
    t.is(initializeCalled, 1, 'onInitialize called');
    t.end();
  }, 150);
});

// NOTE(Tarek): This is for the x * CHANNEL1_RATE
// lines, which are important for clarity.
/* eslint-disable no-implicit-coercion */
test('core#AnimationLoop timeline', t => {
  if (typeof document === 'undefined') {
    t.comment('browser-only test');
    t.end();
    return;
  }

  const {gl} = fixture;

  const animationLoop = new AnimationLoop({
    gl
  });
  const timeline = animationLoop.timeline;
  timeline.pause();
  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  const CHANNEL1_RATE = 2;
  const CHANNEL2_RATE = 3;
  const channel1 = timeline.addChannel({
    rate: CHANNEL1_RATE,
    start: 2,
    end: 6,
    wrapStart: 'clamp',
    wrapEnd: 'loop'
  });
  const channel2 = timeline.addChannel({
    rate: CHANNEL2_RATE,
    start: 3,
    end: 6,
    wrapStart: 'loop',
    wrapEnd: 'clamp'
  });
  t.is(timeline.getChannelTime(channel1), 0 * CHANNEL1_RATE, 'Channel 1 initialized');
  t.is(timeline.getChannelTime(channel2), 0 * CHANNEL2_RATE, 'Channel 2 initialized');

  timeline.setTime(1);
  t.is(timeline.getTime(), 1, 'Timeline was set');
  t.is(timeline.getChannelTime(channel1), 0 * CHANNEL1_RATE, 'Channel 1 was clamped to start');
  t.is(timeline.getChannelTime(channel2), 1 * CHANNEL2_RATE, 'Channel 2 looped before start');

  timeline.setTime(4);
  t.is(timeline.getChannelTime(channel1), 2 * CHANNEL1_RATE, 'Channel 1 set');
  t.is(timeline.getChannelTime(channel2), 1 * CHANNEL2_RATE, 'Channel 2 set');

  timeline.setTime(7);
  t.is(timeline.getChannelTime(channel1), 1 * CHANNEL1_RATE, 'Channel 1 looped after end');
  t.is(timeline.getChannelTime(channel2), 3 * CHANNEL2_RATE, 'Channel 2 clamped to end');

  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  timeline.play();
  timeline.update(4);
  timeline.update(8);
  t.is(timeline.getTime(), 4, 'Timeline was set on update while playing');
  t.is(
    timeline.getChannelTime(channel1),
    2 * CHANNEL1_RATE,
    'Channel 1 was set on update while playing'
  );
  t.is(
    timeline.getChannelTime(channel2),
    1 * CHANNEL2_RATE,
    'Channel 2 was set on update while playing'
  );

  timeline.reset();
  t.is(timeline.getTime(), 0, 'Timeline was reset');
  timeline.pause();
  timeline.update(4);
  timeline.update(8);
  t.is(timeline.getTime(), 0, 'Timeline was not set on update while paused');
  t.is(
    timeline.getChannelTime(channel1),
    0 * CHANNEL1_RATE,
    'Channel 1 was not set on update while paused'
  );
  t.is(
    timeline.getChannelTime(channel2),
    0 * CHANNEL2_RATE,
    'Channel 2 was not set on update while paused'
  );

  timeline.removeChannel(channel1);
  t.is(timeline.getChannelTime(channel1), -1, 'Channel 1 was deleted');
  t.end();
});
