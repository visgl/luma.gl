import test from 'tape-promise/tape';
import {webglDevice as device} from '@luma.gl/test-utils';

import {AnimationLoop} from '@luma.gl/engine';

test('engine#AnimationLoop constructor', (t) => {
  t.ok(AnimationLoop, 'AnimationLoop imported');
  const animationLoop = new AnimationLoop({device});
  t.ok(animationLoop, 'AnimationLoop constructor should not throw');
  t.end();
});

test('engine#AnimationLoop start,stop', (t) => {
  let initializeCalled = 0;
  let renderCalled = 0;
  let finalizeCalled = 0;

  new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    },
    onRender: ({animationLoop}) => {
      renderCalled++;

      t.is(animationLoop.device.isLost, false, 'isContextLost returns false');

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

test('engine#AnimationLoop redraw', (t) => {
  let renderCalled = 0;

  new AnimationLoop({
    device,
    onInitialize: async ({animationLoop}) => {
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

test('engine#AnimationLoop should not call initialize more than once', async (t) => {
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
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

test('engine#AnimationLoop two start()s should only run one loop', async (t) => {
  let renderCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
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

test.skip('engine#AnimationLoop start followed immediately by stop() should stop', (t) => {
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
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

test('engine#AnimationLoop a start/stop/start should not call initialize again', (t) => {
  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
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
