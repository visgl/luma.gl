// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('CanvasObserver#start is idempotent and stop is idempotent', () => {
  if (!isBrowser()) {
    void 0;
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
      resizeObserverBox: 'device-pixel-content-box',
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    observer.start();
    observer.stop();
    observer.stop();

    expect(calls.resizeObserve, 'resize observer only starts once').toBe(1);
    expect(calls.intersectionObserve, 'intersection observer only starts once').toBe(1);
    expect(calls.setTimeout, 'deferred DPR observation is only scheduled once').toBe(1);
    expect(calls.clearTimeout, 'deferred DPR observation is only cleared once').toBe(1);
    expect(calls.resizeDisconnect, 'resize observer only disconnects once').toBe(1);
    expect(calls.intersectionDisconnect, 'intersection observer only disconnects once').toBe(1);
  } finally {
    restoreGlobals(globalScope, originals);
  }

  void 0;
});

it('CanvasObserver#trackPosition polling stops after stop', () => {
  if (!isBrowser()) {
    void 0;
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
      resizeObserverBox: 'device-pixel-content-box',
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {
        positionChangeCalls++;
      }
    });

    observer.start();
    expect(Boolean(intervalCallback), 'position polling interval is scheduled').toBe(true);

    intervalCallback?.();
    expect(positionChangeCalls, 'position polling callback fires while observer is active').toBe(1);

    observer.stop();
    expect(clearIntervalCalls, 'position polling interval is cleared on stop').toBe(1);

    intervalCallback?.();
    expect(positionChangeCalls, 'position polling callback does not fire after stop').toBe(1);
  } finally {
    restoreGlobals(globalScope, originals);
  }

  void 0;
});

it('CanvasObserver#resizeObserverBox uses device-pixel-content-box when specified', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const globalScope = globalThis;
  const originals = getOriginalGlobals(globalScope);
  let observedBox: string | undefined;

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_target: Element, options?: ResizeObserverOptions) {
      observedBox = options?.box;
    }
    disconnect() {}
  } as typeof ResizeObserver;
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    disconnect() {}
  } as typeof IntersectionObserver;
  globalScope.setTimeout = (callback: TimerHandler, delay?: number) =>
    originals.setTimeout.call(globalScope, callback, delay);

  try {
    const observer = new CanvasObserver({
      canvas: document.createElement('canvas'),
      trackPosition: false,
      resizeObserverBox: 'device-pixel-content-box',
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    expect(observedBox, 'uses device-pixel-content-box').toBe('device-pixel-content-box');
    observer.stop();
  } finally {
    restoreGlobals(globalScope, originals);
  }

  void 0;
});

it('CanvasObserver#resizeObserverBox uses content-box when specified', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const globalScope = globalThis;
  const originals = getOriginalGlobals(globalScope);
  let observedBox: string | undefined;

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_target: Element, options?: ResizeObserverOptions) {
      observedBox = options?.box;
    }
    disconnect() {}
  } as typeof ResizeObserver;
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    disconnect() {}
  } as typeof IntersectionObserver;
  globalScope.setTimeout = (callback: TimerHandler, delay?: number) =>
    originals.setTimeout.call(globalScope, callback, delay);

  try {
    const observer = new CanvasObserver({
      canvas: document.createElement('canvas'),
      trackPosition: false,
      resizeObserverBox: 'content-box',
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    expect(observedBox, 'uses content-box when resizeObserverBox is set').toBe('content-box');
    observer.stop();
  } finally {
    restoreGlobals(globalScope, originals);
  }

  void 0;
});

it('CanvasObserver#start is a no-op without an HTML canvas', () => {
  if (!isBrowser()) {
    void 0;
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
      resizeObserverBox: 'device-pixel-content-box',
      onResize: () => {},
      onIntersection: () => {},
      onDevicePixelRatioChange: () => {},
      onPositionChange: () => {}
    });

    observer.start();
    observer.stop();

    expect(calls.resizeObserve, 'resize observer is never started').toBe(0);
    expect(calls.intersectionObserve, 'intersection observer is never started').toBe(0);
    expect(calls.setTimeout, 'deferred DPR observation is never scheduled').toBe(0);
  } finally {
    restoreGlobals(globalScope, originals);
  }

  void 0;
});
