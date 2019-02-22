/* global document, setTimeout */
import {AnimationLoop} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

test('WebGL#AnimationLoop constructor', t => {
  t.ok(AnimationLoop, 'AnimationLoop imported');

  const {gl} = fixture;
  const animationLoop = new AnimationLoop({gl});
  t.ok(animationLoop, 'AnimationLoop constructor should not throw');
  t.end();
});

test('WebGL#AnimationLoop start,stop', t => {
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

test('WebGL#AnimationLoop redraw', t => {
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

test('WebGL#AnimationLoop two start()s should only run one loop', t => {
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
    },
    onRender: () => {
      animationLoop.stop();
      // FIXME: this is not directly test that only one loop has been started
      t.is(initializeCalled, 1, 'onInitialize called');
      t.end();
    }
  });
  animationLoop.start();
  animationLoop.start();
});

test('WebGL#AnimationLoop start followed immediately by stop() should stop', t => {
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

test('WebGL#AnimationLoop a start/stop/start should not call initialize again', t => {
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
