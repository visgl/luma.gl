// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {CanvasContextProps, PresentationContextProps} from '@luma.gl/core';
import {CanvasContext, PresentationContext, Framebuffer} from '@luma.gl/core';
import {isBrowser} from '@probe.gl/env';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';

/** Mock CanvasContext */
class TestCanvasContext extends CanvasContext {
  handle = null;
  [Symbol.toStringTag] = 'TestCanvasContext';
  // @ts-expect-error
  readonly device = {
    limits: {maxTextureDimension2D: 1024},
    props: {
      onResize: () => {},
      onDevicePixelRatioChange: () => {},
      onVisibilityChange: () => {},
      onPositionChange: () => {}
    }
  };
  constructor(props: CanvasContextProps = {}, startObservers = true) {
    super(props);
    if (startObservers) {
      this._startObservers();
    }
  }
  protected override _getCurrentFramebuffer(): Framebuffer {
    throw new Error('test');
  }
  protected override _configureDevice(): void {
    // Mock update device
  }
}

/** Mock PresentationContext */
class TestPresentationContext extends PresentationContext {
  [Symbol.toStringTag] = 'TestPresentationContext';
  // @ts-expect-error
  readonly device = {
    limits: {maxTextureDimension2D: 1024},
    props: {
      onResize: () => {},
      onDevicePixelRatioChange: () => {},
      onVisibilityChange: () => {},
      onPositionChange: () => {}
    }
  };
  constructor(props: PresentationContextProps = {}, startObservers = true) {
    super(props);
    if (startObservers) {
      this._startObservers();
    }
  }
  present(): void {}
  protected override _getCurrentFramebuffer(): Framebuffer {
    throw new Error('test');
  }
  protected override _configureDevice(): void {
    // Mock update device
  }
}

it('CanvasContext preserves HDR presentation options', () => {
  const canvasContext = new TestCanvasContext(
    {
      colorFormat: 'rgba16float',
      colorSpace: 'display-p3',
      toneMapping: 'extended'
    },
    false
  );

  expect(canvasContext.props.colorFormat, 'preserves floating format').toBe('rgba16float');
  expect(canvasContext.props.colorSpace, 'preserves wide color gamut').toBe('display-p3');
  expect(canvasContext.props.toneMapping, 'preserves extended luminance').toBe('extended');

  canvasContext.destroy();
  void 0;
});

function createCanvasContextSpyDevice() {
  const calls = {onResize: 0, onVisibilityChange: 0};
  return {
    calls,
    device: {
      limits: {maxTextureDimension2D: 1024},
      props: {
        onResize: () => {
          calls.onResize++;
        },
        onVisibilityChange: () => {
          calls.onVisibilityChange++;
        },
        onDevicePixelRatioChange: () => {},
        onPositionChange: () => {}
      }
    }
  };
}

function createContextSuite(
  label: string,
  createContext: () => CanvasContext | PresentationContext
) {
  it(`${label}#_handleIntersection does not call callbacks when destroyed`, () => {
    if (!isBrowser()) {
      void 0;
      return;
    }

    const {calls, device} = createCanvasContextSpyDevice();
    const canvasContext = createContext();
    // @ts-expect-error read only
    canvasContext.device = device;

    (canvasContext as any)._handleIntersection([
      {target: canvasContext.canvas, isIntersecting: false}
    ]);

    expect(calls.onVisibilityChange, 'visibility change is observed when context is active').toBe(
      1
    );

    calls.onVisibilityChange = 0;
    // @ts-expect-error read only
    canvasContext.destroyed = true;
    (canvasContext as any)._handleIntersection([
      {target: canvasContext.canvas, isIntersecting: true}
    ]);
    expect(calls.onVisibilityChange, 'destroyed context does not emit visibility events').toBe(0);

    void 0;
  });

  it(`${label}#_handleResize does not call callbacks when destroyed`, () => {
    if (!isBrowser()) {
      void 0;
      return;
    }

    const {calls, device} = createCanvasContextSpyDevice();
    const canvasContext = createContext();
    // @ts-expect-error read only
    canvasContext.device = device;

    (canvasContext as any)._handleResize([
      {
        target: canvasContext.canvas,
        contentBoxSize: [{inlineSize: 10, blockSize: 20}]
      }
    ]);

    expect(calls.onResize, 'resize is observed when context is active').toBe(1);

    calls.onResize = 0;
    // @ts-expect-error read only
    canvasContext.destroyed = true;
    (canvasContext as any)._handleResize([
      {
        target: canvasContext.canvas,
        contentBoxSize: [{inlineSize: 20, blockSize: 40}]
      }
    ]);
    expect(calls.onResize, 'destroyed context does not emit resize events').toBe(0);

    void 0;
  });

  it(`${label}#destroy is idempotent`, () => {
    if (!isBrowser()) {
      void 0;
      return;
    }

    const calls = {stop: 0};
    const canvasContext = createContext();
    // @ts-expect-error read only
    canvasContext._canvasObserver = {
      start: () => {},
      stop: () => {
        calls.stop++;
      },
      started: true
    };

    expect(() => {
      canvasContext.destroy();
      canvasContext.destroy();
    }, 'destroying twice should be safe').not.toThrow();

    expect(calls.stop, 'canvas observer stopped exactly once').toBe(1);

    void 0;
  });

  it(`${label}#destroy cancels deferred DPR timer`, () => {
    if (!isBrowser()) {
      void 0;
      return;
    }

    const globalScope = globalThis as any;
    const originalSetTimeout = globalScope.setTimeout;
    const originalClearTimeout = globalScope.clearTimeout;

    let capturedTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let capturedCallback: (() => void) | null = null;
    let clearTimeoutCalls = 0;

    globalScope.setTimeout = (callback: () => void) => {
      capturedCallback = callback;
      capturedTimeoutId = 1 as ReturnType<typeof setTimeout>;
      return capturedTimeoutId;
    };
    globalScope.clearTimeout = (id: ReturnType<typeof setTimeout>) => {
      clearTimeoutCalls++;
      expect(id, 'clearTimeout called with deferred DPR timer id').toBe(capturedTimeoutId);
    };

    try {
      const canvasContext = createContext();
      canvasContext.destroy();

      expect(clearTimeoutCalls, 'deferred DPR timer is canceled on destroy').toBe(1);
      if (capturedCallback) {
        expect(
          () => capturedCallback(),
          'DPR callback after destroy should not crash'
        ).not.toThrow();
      } else {
        expect(false, 'DPR callback should be scheduled by constructor').toBe(true);
      }

      expect(() => {
        canvasContext.destroy();
      }, 'destroy can still be called after callback has been handled').not.toThrow();
    } finally {
      globalScope.setTimeout = originalSetTimeout;
      globalScope.clearTimeout = originalClearTimeout;
    }

    void 0;
  });
}

it('CanvasContext#defined', () => {
  expect(Boolean(CanvasContext), 'CanvasContext defined').toBe(true);
  // t.ok(new WEBGLCanvasContext()), 'Context creation ok');
  void 0;
});

it('CanvasContext', () => {
  if (isBrowser()) {
    let canvasContext = new TestCanvasContext();
    expect(Boolean(canvasContext), '').toBe(true);

    canvasContext = new TestCanvasContext({useDevicePixels: false});
    expect(Boolean(canvasContext), '').toBe(true);
    expect(canvasContext.getDevicePixelSize(), '').toEqual([800, 600]);
  }
  void 0;
});

it('CanvasContext#_handleResize prefers exact device pixel size by default', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext({}, false);

  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 100.2, blockSize: 50.2}],
      devicePixelContentBoxSize: [{inlineSize: 150, blockSize: 75}]
    }
  ]);

  expect(canvasContext.getDevicePixelSize(), 'exact pixel size is tracked').toEqual([150, 75]);
  expect(
    canvasContext.getDrawingBufferSize(),
    'drawing buffer follows exact pixel size when useDevicePixels=true'
  ).toEqual([150, 75]);
  void 0;
});

it('CanvasContext#_handleResize supports css-dpr compatibility sizing', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext({pixelSizeSource: 'css-dpr'}, false);
  const originalGetDevicePixelRatio = canvasContext.getDevicePixelRatio;
  canvasContext.getDevicePixelRatio = () => 1.5;

  try {
    (canvasContext as any)._handleResize([
      {
        target: canvasContext.canvas,
        contentBoxSize: [{inlineSize: 100.4, blockSize: 50.4}],
        devicePixelContentBoxSize: [{inlineSize: 151, blockSize: 76}]
      }
    ]);

    expect(
      canvasContext.getDevicePixelSize(),
      'css-dpr mode floors css size times DPR and ignores exact observer size'
    ).toEqual([150, 75]);
    expect(
      canvasContext.getDrawingBufferSize(),
      'drawing buffer follows compatibility device pixel size when useDevicePixels=true'
    ).toEqual([150, 75]);
  } finally {
    canvasContext.getDevicePixelRatio = originalGetDevicePixelRatio;
  }

  void 0;
});

it('CanvasContext#_handleResize keeps numeric useDevicePixels override across pixel size modes', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext(
    {pixelSizeSource: 'css-dpr', useDevicePixels: 2},
    false
  );
  const originalGetDevicePixelRatio = canvasContext.getDevicePixelRatio;
  canvasContext.getDevicePixelRatio = () => 1.5;

  try {
    (canvasContext as any)._handleResize([
      {
        target: canvasContext.canvas,
        contentBoxSize: [{inlineSize: 100.2, blockSize: 50.2}],
        devicePixelContentBoxSize: [{inlineSize: 151, blockSize: 76}]
      }
    ]);

    expect(canvasContext.getDevicePixelSize(), 'compatibility pixel size is tracked').toEqual([
      150, 75
    ]);
    expect(
      canvasContext.getDrawingBufferSize(),
      'numeric useDevicePixels still controls drawing buffer size'
    ).toEqual([200, 100]);
  } finally {
    canvasContext.getDevicePixelRatio = originalGetDevicePixelRatio;
  }

  void 0;
});

it('CanvasContext#_observeDevicePixelRatio recalculates drawing buffer in css-dpr mode', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext({pixelSizeSource: 'css-dpr'}, false);
  let resizeCalls = 0;
  // @ts-expect-error read only
  canvasContext.device = {
    limits: {maxTextureDimension2D: 4096},
    props: {
      onResize: () => {
        resizeCalls++;
      },
      onDevicePixelRatioChange: () => {},
      onVisibilityChange: () => {},
      onPositionChange: () => {}
    }
  };

  // Simulate an initial resize at DPR 2
  canvasContext.getDevicePixelRatio = () => 2;
  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 400, blockSize: 300}]
    }
  ]);
  expect(canvasContext.getDevicePixelSize(), 'initial size at DPR 2').toEqual([800, 600]);

  // Simulate a DPR change to 1.5 (browser zoom)
  resizeCalls = 0;
  let lastOldPixelSize: [number, number] | undefined;
  // @ts-expect-error read only
  canvasContext.device = {
    ...canvasContext.device,
    props: {
      ...canvasContext.device.props,
      onResize: (_ctx: any, {oldPixelSize}: {oldPixelSize: [number, number]}) => {
        resizeCalls++;
        lastOldPixelSize = oldPixelSize;
      }
    }
  };
  canvasContext.getDevicePixelRatio = () => 1.5;
  // Mark the observer as started so _observeDevicePixelRatio doesn't bail
  (canvasContext as any)._canvasObserver = {started: true};
  (canvasContext as any)._observeDevicePixelRatio();

  expect(
    canvasContext.getDevicePixelSize(),
    'DPR change recalculates device pixel size using Math.floor(css * newDpr)'
  ).toEqual([600, 450]);
  expect(resizeCalls, 'onResize is called when DPR changes in css-dpr mode').toBe(1);
  expect(lastOldPixelSize, 'onResize receives the previous pixel size').toEqual([800, 600]);

  void 0;
});

it('CanvasContext#_observeDevicePixelRatio clamps to max texture size in css-dpr mode', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext({pixelSizeSource: 'css-dpr'}, false);
  // @ts-expect-error read only
  canvasContext.device = {
    limits: {maxTextureDimension2D: 2048},
    props: {
      onResize: () => {},
      onDevicePixelRatioChange: () => {},
      onVisibilityChange: () => {},
      onPositionChange: () => {}
    }
  };

  // Set up a large canvas (1500x1200 CSS) at DPR 2 = 3000x2400 which exceeds 2048
  canvasContext.getDevicePixelRatio = () => 2;
  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 1500, blockSize: 1200}]
    }
  ]);
  expect(canvasContext.getDevicePixelSize(), 'initial size clamped by _handleResize').toEqual([
    2048, 2048
  ]);

  // Now simulate a DPR change to 3 (4500x3600 unclamped)
  canvasContext.getDevicePixelRatio = () => 3;
  (canvasContext as any)._canvasObserver = {started: true};
  (canvasContext as any)._observeDevicePixelRatio();

  expect(
    canvasContext.getDevicePixelSize(),
    'DPR change clamps pixel size to maxTextureDimension2D'
  ).toEqual([2048, 2048]);

  void 0;
});

it('CanvasContext#_startObservers defers DOM observation until explicitly started', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const globalScope = globalThis as any;
  const originalResizeObserver = globalScope.ResizeObserver;
  const originalIntersectionObserver = globalScope.IntersectionObserver;

  const calls = {resizeObserverObserve: 0, intersectionObserverObserve: 0};

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {
      calls.resizeObserverObserve++;
    }
    disconnect() {}
  };
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {
      calls.intersectionObserverObserve++;
    }
    disconnect() {}
  };

  try {
    const canvasContext = new TestCanvasContext({}, false);

    expect(calls.resizeObserverObserve, 'resize observer is not started during construction').toBe(
      0
    );
    expect(
      calls.intersectionObserverObserve,
      'intersection observer is not started during construction'
    ).toBe(0);

    canvasContext._startObservers();

    expect(
      calls.resizeObserverObserve,
      'resize observer starts after explicit initialization'
    ).toBe(1);
    expect(
      calls.intersectionObserverObserve,
      'intersection observer starts after explicit initialization'
    ).toBe(1);

    canvasContext.destroy();
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
  }

  void 0;
});

it('CanvasContext#_startObservers is idempotent', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const globalScope = globalThis as any;
  const originalResizeObserver = globalScope.ResizeObserver;
  const originalIntersectionObserver = globalScope.IntersectionObserver;
  const originalSetTimeout = globalScope.setTimeout;

  const calls = {
    resizeObserverObserve: 0,
    intersectionObserverObserve: 0,
    setTimeout: 0
  };

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {
      calls.resizeObserverObserve++;
    }
    disconnect() {}
  };
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {
      calls.intersectionObserverObserve++;
    }
    disconnect() {}
  };
  globalScope.setTimeout = (callback: () => void) => {
    calls.setTimeout++;
    return originalSetTimeout(callback, 0);
  };

  try {
    const canvasContext = new TestCanvasContext({}, false);
    canvasContext._startObservers();
    canvasContext._startObservers();

    expect(calls.resizeObserverObserve, 'resize observer only starts once').toBe(1);
    expect(calls.intersectionObserverObserve, 'intersection observer only starts once').toBe(1);
    expect(calls.setTimeout, 'deferred DPR observation is only scheduled once').toBe(1);

    canvasContext.destroy();
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
    globalScope.setTimeout = originalSetTimeout;
  }

  void 0;
});

it('CanvasContext#trackPosition polling stops on destroy', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const globalScope = globalThis as any;
  const originalResizeObserver = globalScope.ResizeObserver;
  const originalIntersectionObserver = globalScope.IntersectionObserver;
  const originalSetInterval = globalScope.setInterval;
  const originalClearInterval = globalScope.clearInterval;

  let intervalCallback: (() => void) | null = null;
  let clearIntervalCalls = 0;

  globalScope.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    disconnect() {}
  };
  globalScope.IntersectionObserver = class {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    disconnect() {}
  };
  globalScope.setInterval = (callback: () => void) => {
    intervalCallback = callback;
    return 1 as ReturnType<typeof setInterval>;
  };
  globalScope.clearInterval = (_id: ReturnType<typeof setInterval>) => {
    clearIntervalCalls++;
  };

  try {
    const canvasContext = new TestCanvasContext({trackPosition: true}, false);
    let updatePositionCalls = 0;
    canvasContext.updatePosition = () => {
      updatePositionCalls++;
    };

    canvasContext._startObservers();

    expect(Boolean(intervalCallback), 'position polling interval is scheduled').toBe(true);
    intervalCallback?.();
    expect(updatePositionCalls, 'position polling calls updatePosition while active').toBe(1);

    canvasContext.destroy();
    expect(clearIntervalCalls, 'position polling interval is cleared on destroy').toBe(1);

    intervalCallback?.();
    expect(updatePositionCalls, 'position polling no longer updates after destroy').toBe(1);
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
    globalScope.setInterval = originalSetInterval;
    globalScope.clearInterval = originalClearInterval;
  }

  void 0;
});

it('PresentationContext#defined', () => {
  expect(Boolean(PresentationContext), 'PresentationContext defined').toBe(true);
  void 0;
});

createContextSuite('CanvasContext', () => new TestCanvasContext());
createContextSuite('PresentationContext', () => new TestPresentationContext());

it('CanvasContext#destroy nulls device to catch later access', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const canvasContext = new TestCanvasContext();
  canvasContext.destroy();
  // @ts-expect-error
  expect(canvasContext.device, 'destroyed context device should be null').toBe(null);
  void 0;
});

it('CanvasContext#getDevicePixelRatio', async () => {
  const windowPixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const TEST_CASES = [
    {
      name: 'useDevicePixels: true: should use window.devicePixelRatio or 1',
      useDevicePixels: true,
      expected: windowPixelRatio
      // TODO - would require mocking window.devicePixelRatio
      // },
      // {
      //   name: 'useDevicePixels: false: should use 1',
      //   useDevicePixels: false,
      //   expected: 1
      // },
      // {
      //   name: 'Non Finite useDevicePixels null: should use 1',
      //   useDevicePixels: null,
      //   expected: 1
      // },
      // {
      //   name: 'Non valid useDevicePixels 0: should use 1',
      //   useDevicePixels: 0,
      //   expected: 1
      // },
      // {
      //   name: 'Non valid useDevicePixels negative: should use 1',
      //   useDevicePixels: -3.2,
      //   expected: 1
      // },
      // {
      //   name: 'Valid useDevicePixels, should use it',
      //   useDevicePixels: 1.5,
      //   expected: 1.5
    }
  ];

  for (const device of await getTestDevices()) {
    TEST_CASES.forEach(tc => {
      const result = device.getDefaultCanvasContext().getDevicePixelRatio(tc.useDevicePixels);
      expect(result, tc.name).toBe(tc.expected);
    });
  }
  void 0;
});

// TODO - can these tests be moved up into canvas-context.spec?
const LOW_DPR = 0.5;
const HIGH_DPR = 4;
const HIGH_DPR_FRACTION = 2.5;
const MAP_TEST_CASES = [
  {
    name: 'device pixel ratio 1',
    drawingBufferWidth: 10,
    drawingBufferHeight: 10,
    clientWidth: 10,
    clientHeight: 10,
    ratio: 1,
    windowPositions: [
      [0, 0],
      [2, 2],
      [9, 9]
    ],
    devicePositionsInverted: [
      {
        x: 0,
        y: 9,
        width: 1,
        height: 1
      },
      {
        x: 2,
        y: 7,
        width: 1,
        height: 1
      },
      {
        x: 9,
        y: 0,
        width: 1,
        height: 1
      }
    ],
    devicePositions: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      },
      {
        x: 2,
        y: 2,
        width: 1,
        height: 1
      },
      {
        x: 9,
        y: 9,
        width: 1,
        height: 1
      }
    ]
  },
  {
    name: 'device pixel ratio 1, 1X1 window',
    drawingBufferWidth: 1,
    drawingBufferHeight: 1,
    clientWidth: 1,
    clientHeight: 1,
    ratio: 1,
    windowPositions: [[0, 0]],
    devicePositionsInverted: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      }
    ],
    devicePositions: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      }
    ]
  },
  {
    name: 'device pixel ratio > 1',
    drawingBufferWidth: 10 * HIGH_DPR,
    drawingBufferHeight: 10 * HIGH_DPR,
    clientWidth: 10,
    clientHeight: 10,
    ratio: HIGH_DPR,
    yInvert: true,
    windowPositions: [
      [0, 0],
      [2, 2],
      [9, 9]
    ],
    // 0 4 8 12 16 20 24 28 32 36 40
    // 0 1 2 3  4  5  6  7  8  9
    devicePositionsInverted: [
      {
        x: 0,
        y: 36,
        width: 4,
        height: 4
      },
      {
        x: 8,
        y: 28,
        width: 4,
        height: 4
      },
      {
        x: 36,
        y: 0,
        width: 4,
        height: 4
      }
    ],
    devicePositions: [
      {
        x: 0,
        y: 0,
        width: 4,
        height: 4
      },
      {
        x: 8,
        y: 8,
        width: 4,
        height: 4
      },
      {
        x: 36,
        y: 36,
        width: 4,
        height: 4
      }
    ]
  },
  {
    name: 'device pixel ratio > 1 (fraction)',
    drawingBufferWidth: 10 * HIGH_DPR_FRACTION,
    drawingBufferHeight: 10 * HIGH_DPR_FRACTION,
    clientWidth: 10,
    clientHeight: 10,
    ratio: HIGH_DPR_FRACTION,
    yInvert: true,
    windowPositions: [
      [0, 0],
      [2, 2],
      [9, 9]
    ],
    // round (2.5) = 3
    // CSS size :   10X10
    // Device size: 25X25
    // CSS:           0  1    2   3    4   5   6  7   8  9   10
    // Device:        0  3    5   8   10  13   15 18  20 23  25
    // Device Ynvert: 24 21   19  16  14  11   9  6   4  1   -1
    devicePositionsInverted: [
      {
        x: 0,
        y: 22,
        width: 3,
        height: 3
      },
      {
        x: 5,
        y: 17,
        width: 3,
        height: 3
      },
      {
        x: 23,
        y: 0,
        width: 2,
        height: 2
      }
    ],
    devicePositions: [
      {
        x: 0,
        y: 0,
        width: 3,
        height: 3
      },
      {
        x: 5,
        y: 5,
        width: 3,
        height: 3
      },
      {
        x: 23,
        y: 23,
        width: 2,
        height: 2
      }
    ]
  },
  {
    name: 'device pixel ratio < 1',
    drawingBufferWidth: 10 * LOW_DPR,
    drawingBufferHeight: 10 * LOW_DPR,
    clientWidth: 10,
    clientHeight: 10,
    ratio: LOW_DPR,
    yInvert: true,
    windowPositions: [
      [0, 0],
      [1, 1],
      [2, 2],
      [8, 8]
    ],
    devicePositionsInverted: [
      {
        x: 0,
        y: 4,
        width: 1,
        height: 1
      },
      {
        x: 1,
        y: 4,
        width: 1,
        height: 1
      },
      {
        x: 1,
        y: 3,
        width: 1,
        height: 1
      },
      {
        x: 4,
        y: 0,
        width: 1,
        height: 1
      }
    ],
    devicePositions: [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      },
      // [1, 1] and [2, 2] point to the same pixel
      {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      },
      {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      },
      {
        x: 4,
        y: 4,
        width: 1,
        height: 1
      }
    ]
  }
];

function configureCanvasContext(
  canvasContext: CanvasContext,
  testCase: {
    clientWidth: number;
    clientHeight: number;
    drawingBufferWidth: number;
    drawingBufferHeight: number;
  }
): () => void {
  const originalCanvasWidth = canvasContext.canvas.width;
  const originalCanvasHeight = canvasContext.canvas.height;
  const originalCssWidth = canvasContext.cssWidth;
  const originalCssHeight = canvasContext.cssHeight;
  const originalDevicePixelWidth = canvasContext.devicePixelWidth;
  const originalDevicePixelHeight = canvasContext.devicePixelHeight;
  const originalDrawingBufferWidth = canvasContext.drawingBufferWidth;
  const originalDrawingBufferHeight = canvasContext.drawingBufferHeight;

  canvasContext.cssWidth = testCase.clientWidth;
  canvasContext.cssHeight = testCase.clientHeight;
  canvasContext.devicePixelWidth = testCase.drawingBufferWidth;
  canvasContext.devicePixelHeight = testCase.drawingBufferHeight;
  canvasContext.drawingBufferWidth = testCase.drawingBufferWidth;
  canvasContext.drawingBufferHeight = testCase.drawingBufferHeight;
  canvasContext.canvas.width = testCase.drawingBufferWidth;
  canvasContext.canvas.height = testCase.drawingBufferHeight;

  return () => {
    canvasContext.cssWidth = originalCssWidth;
    canvasContext.cssHeight = originalCssHeight;
    canvasContext.devicePixelWidth = originalDevicePixelWidth;
    canvasContext.devicePixelHeight = originalDevicePixelHeight;
    canvasContext.drawingBufferWidth = originalDrawingBufferWidth;
    canvasContext.drawingBufferHeight = originalDrawingBufferHeight;
    canvasContext.canvas.width = originalCanvasWidth;
    canvasContext.canvas.height = originalCanvasHeight;
  };
}

it('WebGLCanvasContext#cssToDevicePixels', async () => {
  // Create a fresh device since are going to modify it
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      const restoreCanvasContext = configureCanvasContext(canvasContext, tc);
      try {
        tc.windowPositions.forEach((wPos, i) => {
          // by default yInvert is true
          expect(
            canvasContext?.cssToDevicePixels(tc.windowPositions[i]),
            `${tc.name}(yInvert=true): device pixel should be ${JSON.stringify(
              tc.devicePositionsInverted[i]
            )} for window position ${tc.windowPositions[i]}`
          ).toEqual(tc.devicePositionsInverted[i]);
          expect(
            canvasContext?.cssToDevicePixels(tc.windowPositions[i], false),
            `${tc.name}(yInvert=false): device pixel should match`
          ).toEqual(tc.devicePositions[i]);
        });
      } finally {
        restoreCanvasContext();
      }
    }
  });
  void 0;
});

it('WebGLCanvasContext#cssToDeviceRatio', async () => {
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      const restoreCanvasContext = configureCanvasContext(canvasContext, tc);
      try {
        expect(
          canvasContext?.cssToDeviceRatio(),
          'cssToDeviceRatio should return correct value'
        ).toBe(tc.ratio);
      } finally {
        restoreCanvasContext();
      }
    }
  });

  void 0;
});
