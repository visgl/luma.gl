// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {isBrowser} from '@probe.gl/env';
import {CanvasObserver} from '../../src/adapter/canvas-observer';

type ObserverGlobals = {
  ResizeObserver: typeof globalThis.ResizeObserver;
  IntersectionObserver: typeof globalThis.IntersectionObserver;
  setTimeout: typeof globalThis.setTimeout;
  clearTimeout: typeof globalThis.clearTimeout;
  setInterval: typeof globalThis.setInterval;
  clearInterval: typeof globalThis.clearInterval;
  matchMedia: typeof globalThis.matchMedia;
};

function getOriginalGlobals(globalScope: typeof globalThis): ObserverGlobals {
  return {
    ResizeObserver: globalScope.ResizeObserver,
    IntersectionObserver: globalScope.IntersectionObserver,
    setTimeout: globalScope.setTimeout,
    clearTimeout: globalScope.clearTimeout,
    setInterval: globalScope.setInterval,
    clearInterval: globalScope.clearInterval,
    matchMedia: globalScope.matchMedia
  };
}

function restoreGlobals(globalScope: typeof globalThis, originals: ObserverGlobals): void {
  globalScope.ResizeObserver = originals.ResizeObserver;
  globalScope.IntersectionObserver = originals.IntersectionObserver;
  globalScope.setTimeout = originals.setTimeout;
  globalScope.clearTimeout = originals.clearTimeout;
  globalScope.setInterval = originals.setInterval;
  globalScope.clearInterval = originals.clearInterval;
  globalScope.matchMedia = originals.matchMedia;
}

test('CanvasObserver#start is idempotent and stop is idempotent', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const globalScope = globalThis;
  const originals = getOriginalGlobals(globalScope);
  const calls = {
    resizeObserve: 0,
    resizeDisconnect: 0,
    intersectionObserve: 0,
    intersectionDisconnect: 0,
    setTimeout: 0,
    clearTimeout: 0
  };

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {
      calls.resizeObserve++;
    }
    disconnect() {
      calls.resizeDisconnect++;
    }
  } as typeof ResizeObserver;
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {
      calls.intersectionObserve++;
    }
    disconnect() {
      calls.intersectionDisconnect++;
    }
  } as typeof IntersectionObserver;
  globalScope.setTimeout = (callback: TimerHandler, delay?: number) => {
    calls.setTimeout++;
    return originals.setTimeout.call(globalScope, callback, delay);
  };
  globalScope.clearTimeout = (timeoutId: number | undefined) => {
    calls.clearTimeout++;
    return originals.clearTimeout.call(globalScope, timeoutId);
  };

  try {
    const observer = new CanvasObserver({
      canvas: document.createElement('canvas'),
      trackPosition: false,
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    observer.start();
    observer.stop();
    observer.stop();

    t.equal(calls.resizeObserve, 1, 'resize observer only starts once');
    t.equal(calls.intersectionObserve, 1, 'intersection observer only starts once');
    t.equal(calls.setTimeout, 1, 'deferred DPR observation is only scheduled once');
    t.equal(calls.clearTimeout, 1, 'deferred DPR observation is only cleared once');
    t.equal(calls.resizeDisconnect, 1, 'resize observer only disconnects once');
    t.equal(calls.intersectionDisconnect, 1, 'intersection observer only disconnects once');
  } finally {
    restoreGlobals(globalScope, originals);
  }

  t.end();
});

test('CanvasObserver#trackPosition polling stops after stop', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const globalScope = globalThis;
  const originals = getOriginalGlobals(globalScope);

  let intervalCallback: (() => void) | null = null;
  let positionChangeCalls = 0;
  let clearIntervalCalls = 0;

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    disconnect() {}
  } as typeof ResizeObserver;
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    disconnect() {}
  } as typeof IntersectionObserver;
  globalScope.setTimeout = (callback: TimerHandler, delay?: number) =>
    originals.setTimeout.call(globalScope, callback, delay);
  globalScope.setInterval = (callback: TimerHandler) => {
    intervalCallback = callback as () => void;
    return 1 as ReturnType<typeof setInterval>;
  };
  globalScope.clearInterval = (_intervalId: number | undefined) => {
    clearIntervalCalls++;
  };

  try {
    const observer = new CanvasObserver({
      canvas: document.createElement('canvas'),
      trackPosition: true,
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {
        positionChangeCalls++;
      }
    });

    observer.start();
    t.ok(intervalCallback, 'position polling interval is scheduled');

    intervalCallback?.();
    t.equal(positionChangeCalls, 1, 'position polling callback fires while observer is active');

    observer.stop();
    t.equal(clearIntervalCalls, 1, 'position polling interval is cleared on stop');

    intervalCallback?.();
    t.equal(positionChangeCalls, 1, 'position polling callback does not fire after stop');
  } finally {
    restoreGlobals(globalScope, originals);
  }

  t.end();
});

test('CanvasObserver#start is a no-op without an HTML canvas', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const globalScope = globalThis;
  const originals = getOriginalGlobals(globalScope);
  const calls = {
    resizeObserve: 0,
    intersectionObserve: 0,
    setTimeout: 0
  };

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {
      calls.resizeObserve++;
    }
    disconnect() {}
  } as typeof ResizeObserver;
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {
      calls.intersectionObserve++;
    }
    disconnect() {}
  } as typeof IntersectionObserver;
  globalScope.setTimeout = (callback: TimerHandler, delay?: number) => {
    calls.setTimeout++;
    return originals.setTimeout.call(globalScope, callback, delay);
  };

  try {
    const observer = new CanvasObserver({
      trackPosition: true,
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    observer.stop();

    t.equal(calls.resizeObserve, 0, 'resize observer is never started');
    t.equal(calls.intersectionObserve, 0, 'intersection observer is never started');
    t.equal(calls.setTimeout, 0, 'deferred DPR observation is never scheduled');
  } finally {
    restoreGlobals(globalScope, originals);
  }

  t.end();
});
