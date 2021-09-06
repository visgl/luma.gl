import {AnimationLoop} from '@luma.gl/core';
import test from 'tape-promise/tape';
import {fixture} from 'test/setup';

test('core#AnimationLoop constructor', (t) => {
  t.ok(AnimationLoop, 'AnimationLoop imported');

  const {gl} = fixture;
  const animationLoop = new AnimationLoop({gl});
  t.ok(animationLoop, 'AnimationLoop constructor should not throw');
  t.end();
});

test('core#AnimationLoop start,stop', (t) => {
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

      t.is(animationLoop.isContextLost(), false, 'isContextLost returns false');

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

test('core#AnimationLoop redraw', (t) => {
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

test('core#AnimationLoop should not call initialize more than once', async (t) => {
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

test('core#AnimationLoop two start()s should only run one loop', async (t) => {
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

test('core#AnimationLoop start followed immediately by stop() should stop', (t) => {
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

test('core#AnimationLoop a start/stop/start should not call initialize again', (t) => {
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
    animationLoop.stop();
    t.end();
  }, 150);
});
