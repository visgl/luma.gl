// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {CanvasContextProps, PresentationContextProps} from '@luma.gl/core';
import {CanvasContext, PresentationContext, Framebuffer} from '@luma.gl/core';
import {isBrowser} from '@probe.gl/env';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';

/** Mock CanvasContext */
class TestCanvasContext extends CanvasContext {
  handle = null;
  configureCalls = 0;
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
    this.configureCalls++;
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

test('CanvasContext preserves HDR presentation options', testContext => {
  const canvasContext = new TestCanvasContext(
    {
      colorFormat: 'rgba16float',
      colorSpace: 'display-p3',
      toneMapping: 'extended'
    },
    false
  );

  testContext.equal(canvasContext.props.colorFormat, 'rgba16float', 'preserves floating format');
  testContext.equal(canvasContext.props.colorSpace, 'display-p3', 'preserves wide color gamut');
  testContext.equal(canvasContext.props.toneMapping, 'extended', 'preserves extended luminance');

  canvasContext.destroy();
  testContext.end();
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
  test(`${label}#_handleIntersection does not call callbacks when destroyed`, t => {
    if (!isBrowser()) {
      t.end();
      return;
    }

    const {calls, device} = createCanvasContextSpyDevice();
    const canvasContext = createContext();
    // @ts-expect-error read only
    canvasContext.device = device;

    (canvasContext as any)._handleIntersection([
      {target: canvasContext.canvas, isIntersecting: false}
    ]);

    t.equal(calls.onVisibilityChange, 1, 'visibility change is observed when context is active');

    calls.onVisibilityChange = 0;
    // @ts-expect-error read only
    canvasContext.destroyed = true;
    (canvasContext as any)._handleIntersection([
      {target: canvasContext.canvas, isIntersecting: true}
    ]);
    t.equal(calls.onVisibilityChange, 0, 'destroyed context does not emit visibility events');

    t.end();
  });

  test(`${label}#_handleResize does not call callbacks when destroyed`, t => {
    if (!isBrowser()) {
      t.end();
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

    t.equal(calls.onResize, 1, 'resize is observed when context is active');

    calls.onResize = 0;
    // @ts-expect-error read only
    canvasContext.destroyed = true;
    (canvasContext as any)._handleResize([
      {
        target: canvasContext.canvas,
        contentBoxSize: [{inlineSize: 20, blockSize: 40}]
      }
    ]);
    t.equal(calls.onResize, 0, 'destroyed context does not emit resize events');

    t.end();
  });

  test(`${label}#destroy is idempotent`, t => {
    if (!isBrowser()) {
      t.end();
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

    t.doesNotThrow(() => {
      canvasContext.destroy();
      canvasContext.destroy();
    }, 'destroying twice should be safe');

    t.equal(calls.stop, 1, 'canvas observer stopped exactly once');

    t.end();
  });

  test(`${label}#destroy cancels deferred DPR timer`, t => {
    if (!isBrowser()) {
      t.end();
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
      t.equal(id, capturedTimeoutId, 'clearTimeout called with deferred DPR timer id');
    };

    try {
      const canvasContext = createContext();
      canvasContext.destroy();

      t.equal(clearTimeoutCalls, 1, 'deferred DPR timer is canceled on destroy');
      if (capturedCallback) {
        t.doesNotThrow(() => capturedCallback(), 'DPR callback after destroy should not crash');
      } else {
        t.fail('DPR callback should be scheduled by constructor');
      }

      t.doesNotThrow(() => {
        canvasContext.destroy();
      }, 'destroy can still be called after callback has been handled');
    } finally {
      globalScope.setTimeout = originalSetTimeout;
      globalScope.clearTimeout = originalClearTimeout;
    }

    t.end();
  });
}

test('CanvasContext#defined', t => {
  t.ok(CanvasContext, 'CanvasContext defined');
  // t.ok(new WEBGLCanvasContext()), 'Context creation ok');
  t.end();
});

test('CanvasContext', t => {
  if (isBrowser()) {
    let canvasContext = new TestCanvasContext();
    t.ok(canvasContext);

    canvasContext = new TestCanvasContext({useDevicePixels: false});
    t.ok(canvasContext);
    t.deepEqual(canvasContext.getDevicePixelSize(), [800, 600]);
  }
  t.end();
});

test('CanvasContext#_handleResize prefers exact device pixel size by default', t => {
  if (!isBrowser()) {
    t.end();
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

  t.deepEqual(canvasContext.getDevicePixelSize(), [150, 75], 'exact pixel size is tracked');
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [150, 75],
    'drawing buffer follows exact pixel size when useDevicePixels=true'
  );
  t.end();
});

test('CanvasContext#_handleResize supports css-dpr compatibility sizing', t => {
  if (!isBrowser()) {
    t.end();
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

    t.deepEqual(
      canvasContext.getDevicePixelSize(),
      [150, 75],
      'css-dpr mode floors css size times DPR and ignores exact observer size'
    );
    t.deepEqual(
      canvasContext.getDrawingBufferSize(),
      [150, 75],
      'drawing buffer follows compatibility device pixel size when useDevicePixels=true'
    );
  } finally {
    canvasContext.getDevicePixelRatio = originalGetDevicePixelRatio;
  }

  t.end();
});

test('CanvasContext#_handleResize keeps numeric useDevicePixels override across pixel size modes', t => {
  if (!isBrowser()) {
    t.end();
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

    t.deepEqual(
      canvasContext.getDevicePixelSize(),
      [150, 75],
      'compatibility pixel size is tracked'
    );
    t.deepEqual(
      canvasContext.getDrawingBufferSize(),
      [200, 100],
      'numeric useDevicePixels still controls drawing buffer size'
    );
  } finally {
    canvasContext.getDevicePixelRatio = originalGetDevicePixelRatio;
  }

  t.end();
});

test('CanvasContext#drawingBufferSizeTracking supports canvas, external, and no tracking', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const exactCanvasContext = new TestCanvasContext({drawingBufferSizeTracking: 'canvas'}, false);
  (exactCanvasContext as any)._handleResize([
    {
      target: exactCanvasContext.canvas,
      contentBoxSize: [{inlineSize: 100.4, blockSize: 50.4}],
      devicePixelContentBoxSize: [{inlineSize: 151, blockSize: 76}]
    }
  ]);
  t.deepEqual(
    exactCanvasContext.getDrawingBufferSize(),
    [151, 76],
    'canvas tracking uses exact physical dimensions when available'
  );

  const fallbackCanvasContext = new TestCanvasContext({drawingBufferSizeTracking: 'canvas'}, false);
  (fallbackCanvasContext as any)._handleResize([
    {
      target: fallbackCanvasContext.canvas,
      contentBoxSize: [{inlineSize: 100.4, blockSize: 50.4}]
    }
  ]);
  t.deepEqual(
    fallbackCanvasContext.getDrawingBufferSize(),
    [Math.floor(100.4 * window.devicePixelRatio), Math.floor(50.4 * window.devicePixelRatio)],
    'canvas tracking falls back to CSS dimensions times browser DPR'
  );

  const fixedRatioCanvasContext = new TestCanvasContext(
    {drawingBufferSizeTracking: 'canvas', pixelRatio: 1},
    false
  );
  fixedRatioCanvasContext.getDevicePixelRatio = () => 2;
  (fixedRatioCanvasContext as any)._handleResize([
    {
      target: fixedRatioCanvasContext.canvas,
      contentBoxSize: [{inlineSize: 100.4, blockSize: 50.4}]
    }
  ]);
  t.deepEqual(
    fixedRatioCanvasContext.getDrawingBufferSize(),
    [100, 50],
    'pixelRatio overrides browser DPR in canvas tracking mode'
  );

  const manualCanvasContext = new TestCanvasContext({drawingBufferSizeTracking: 'none'}, false);
  const {calls, device} = createCanvasContextSpyDevice();
  // @ts-expect-error read only
  manualCanvasContext.device = device;
  const originalDrawingBufferSize = manualCanvasContext.getDrawingBufferSize();
  (manualCanvasContext as any)._handleResize([
    {
      target: manualCanvasContext.canvas,
      contentBoxSize: [{inlineSize: 100, blockSize: 50}],
      devicePixelContentBoxSize: [{inlineSize: 200, blockSize: 100}]
    }
  ]);
  t.deepEqual(
    manualCanvasContext.getDrawingBufferSize(),
    originalDrawingBufferSize,
    'manual mode observes resize without changing the drawing buffer'
  );
  t.equal(calls.onResize, 1, 'manual mode continues to emit resize callbacks');

  t.end();
});

test('CanvasContext#external-canvas tracking mirrors source dimensions before drawing', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 320;
  sourceCanvas.height = 180;
  const canvasContext = new TestCanvasContext(
    {
      drawingBufferSizeTracking: 'external-canvas',
      drawingBufferSizeSource: sourceCanvas
    },
    false
  );

  t.equal(
    canvasContext.props.drawingBufferSizeTracking,
    'external-canvas',
    'external canvas tracking is explicit'
  );
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [320, 180],
    'tracked dimensions are exposed without waiting for an observer callback'
  );
  t.deepEqual(
    canvasContext.getDevicePixelSize(),
    [320, 180],
    'tracked dimensions are authoritative for device-pixel consumers'
  );

  sourceCanvas.width = 640;
  sourceCanvas.height = 360;
  t.throws(
    () => canvasContext.getCurrentFramebuffer(),
    /test/,
    'framebuffer acquisition continues after synchronizing the tracked canvas'
  );
  t.deepEqual(
    [canvasContext.canvas.width, canvasContext.canvas.height],
    [640, 360],
    'tracked dimensions are applied immediately before drawing'
  );
  t.equal(canvasContext.configureCalls, 1, 'the target is configured once for a changed size');
  t.throws(() => canvasContext.getCurrentFramebuffer(), /test/, 'the next draw still proceeds');
  t.equal(
    canvasContext.configureCalls,
    1,
    'unchanged tracked dimensions do not reconfigure the target'
  );

  const attachedCanvas = document.createElement('canvas');
  const attachedCanvasContext = new TestCanvasContext(
    {
      canvas: attachedCanvas,
      drawingBufferSizeTracking: 'external-canvas',
      drawingBufferSizeSource: attachedCanvas
    },
    false
  );
  attachedCanvas.width = 512;
  attachedCanvas.height = 256;
  t.deepEqual(
    attachedCanvasContext.getDrawingBufferSize(),
    [512, 256],
    'tracking the target itself follows externally owned drawing-buffer changes'
  );

  t.throws(
    () =>
      new TestCanvasContext(
        {
          drawingBufferSizeSource: sourceCanvas,
          drawingBufferSizeTracking: 'canvas'
        },
        false
      ),
    /assertion failed/,
    'canvas tracking rejects an external source'
  );
  t.throws(
    () =>
      new TestCanvasContext(
        {
          drawingBufferSizeTracking: 'external-canvas',
          drawingBufferSizeSource: sourceCanvas,
          pixelRatio: 2
        },
        false
      ),
    /assertion failed/,
    'external canvas tracking rejects a conflicting pixel ratio'
  );
  t.throws(
    () => new TestCanvasContext({drawingBufferSizeTracking: 'external-canvas'}, false),
    /assertion failed/,
    'external canvas tracking requires a source'
  );
  t.throws(
    () => new TestCanvasContext({drawingBufferSizeSource: sourceCanvas}, false),
    /assertion failed/,
    'an external source requires an explicit tracking behavior'
  );

  t.end();
});

test('CanvasContext#setProps updates drawing buffer sizing and observer mode', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const canvasContext = new TestCanvasContext(
    {drawingBufferSizeTracking: 'canvas', pixelRatio: 1},
    false
  );
  canvasContext.getDevicePixelRatio = () => 1.5;
  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 100, blockSize: 50}]
    }
  ]);

  canvasContext.setProps({pixelRatio: 2});
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [200, 100],
    'dynamic fixed ratio is applied immediately'
  );

  canvasContext.setProps({pixelRatio: undefined});
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [150, 75],
    'clearing the fixed ratio resumes exact device-pixel tracking'
  );
  t.equal(
    (canvasContext as any)._canvasObserver.props.resizeObserverBox,
    'device-pixel-content-box',
    'clearing pixelRatio reconfigures the observer box'
  );
  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 100, blockSize: 50}],
      devicePixelContentBoxSize: [{inlineSize: 151, blockSize: 76}]
    }
  ]);
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [151, 76],
    'exact observer dimensions are used after switching mode'
  );

  canvasContext.setProps({drawingBufferSizeTracking: 'none'});
  (canvasContext as any)._handleResize([
    {
      target: canvasContext.canvas,
      contentBoxSize: [{inlineSize: 200, blockSize: 100}],
      devicePixelContentBoxSize: [{inlineSize: 300, blockSize: 150}]
    }
  ]);
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [151, 76],
    'switching to manual mode stops automatic drawing buffer changes'
  );

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 240;
  sourceCanvas.height = 120;
  canvasContext.setProps({
    drawingBufferSizeTracking: 'external-canvas',
    drawingBufferSizeSource: sourceCanvas
  });
  t.deepEqual(
    canvasContext.getDrawingBufferSize(),
    [240, 120],
    'external canvas tracking can take ownership dynamically'
  );

  canvasContext.setProps({
    drawingBufferSizeSource: null,
    drawingBufferSizeTracking: 'canvas',
    pixelRatio: 1
  });
  t.equal(
    canvasContext.props.drawingBufferSizeSource,
    null,
    'external size source can be cleared dynamically'
  );
  t.equal(
    canvasContext.props.drawingBufferSizeTracking,
    'canvas',
    'canvas tracking can resume when the external source is cleared'
  );

  t.end();
});

test('CanvasContext#new drawing buffer sizing props override and validate legacy props', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const legacyCSSCanvasContext = new TestCanvasContext({useDevicePixels: false}, false);
  t.equal(
    legacyCSSCanvasContext.props.drawingBufferSizeTracking,
    'canvas',
    'legacy false normalizes to canvas tracking'
  );
  t.equal(legacyCSSCanvasContext.props.pixelRatio, 1, 'legacy false normalizes to ratio 1');

  const legacyNumericCanvasContext = new TestCanvasContext({useDevicePixels: 1.5}, false);
  t.equal(
    legacyNumericCanvasContext.props.drawingBufferSizeTracking,
    'canvas',
    'legacy numeric ratio normalizes to canvas tracking'
  );
  t.equal(legacyNumericCanvasContext.props.pixelRatio, 1.5, 'legacy numeric ratio is preserved');

  const legacyExactCanvasContext = new TestCanvasContext(
    {useDevicePixels: true, pixelSizeSource: 'exact'},
    false
  );
  t.equal(
    legacyExactCanvasContext.props.drawingBufferSizeTracking,
    'canvas',
    'legacy exact sizing normalizes to canvas tracking'
  );

  const legacyCSSDPRCanvasContext = new TestCanvasContext(
    {useDevicePixels: true, pixelSizeSource: 'css-dpr'},
    false
  );
  t.equal(
    legacyCSSDPRCanvasContext.props.drawingBufferSizeTracking,
    'canvas',
    'legacy CSS-DPR sizing normalizes to canvas tracking'
  );
  t.equal(
    legacyCSSDPRCanvasContext.props.pixelRatio,
    undefined,
    'legacy CSS-DPR sizing continues tracking the browser DPR'
  );

  const legacyManualCanvasContext = new TestCanvasContext({autoResize: false}, false);
  t.equal(
    legacyManualCanvasContext.props.drawingBufferSizeTracking,
    'none',
    'legacy autoResize false normalizes to no tracking'
  );

  const newCanvasContext = new TestCanvasContext(
    {
      drawingBufferSizeTracking: 'canvas',
      autoResize: false,
      useDevicePixels: false,
      pixelSizeSource: 'exact'
    },
    false
  );
  newCanvasContext.getDevicePixelRatio = () => 2;
  (newCanvasContext as any)._handleResize([
    {
      target: newCanvasContext.canvas,
      contentBoxSize: [{inlineSize: 100, blockSize: 50}],
      devicePixelContentBoxSize: [{inlineSize: 200, blockSize: 100}]
    }
  ]);
  t.deepEqual(
    newCanvasContext.getDrawingBufferSize(),
    [200, 100],
    'new canvas tracking ignores conflicting legacy sizing props'
  );
  newCanvasContext.setProps({useDevicePixels: 1});
  t.equal(
    newCanvasContext.props.pixelRatio,
    undefined,
    'legacy updates are ignored after selecting the new sizing API'
  );

  t.throws(
    () => new TestCanvasContext({drawingBufferSizeTracking: 'none', pixelRatio: 2}, false),
    /assertion failed/,
    'pixelRatio is rejected outside canvas tracking'
  );
  t.throws(
    () => new TestCanvasContext({pixelRatio: 2}, false),
    /assertion failed/,
    'pixelRatio requires explicit canvas tracking'
  );
  t.throws(
    () => new TestCanvasContext({drawingBufferSizeTracking: 'canvas', pixelRatio: 0}, false),
    /assertion failed/,
    'non-positive pixelRatio is rejected'
  );
  t.throws(
    () => new TestCanvasContext({drawingBufferSizeTracking: 'canvas', pixelRatio: Infinity}, false),
    /assertion failed/,
    'non-finite pixelRatio is rejected'
  );
  t.throws(
    () => new TestCanvasContext({useDevicePixels: 0}, false),
    /assertion failed/,
    'invalid legacy numeric ratio is rejected'
  );

  t.end();
});

test('CanvasContext#_observeDevicePixelRatio recalculates drawing buffer in css-dpr mode', t => {
  if (!isBrowser()) {
    t.end();
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
  t.deepEqual(canvasContext.getDevicePixelSize(), [800, 600], 'initial size at DPR 2');

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

  t.deepEqual(
    canvasContext.getDevicePixelSize(),
    [600, 450],
    'DPR change recalculates device pixel size using Math.floor(css * newDpr)'
  );
  t.equal(resizeCalls, 1, 'onResize is called when DPR changes in css-dpr mode');
  t.deepEqual(lastOldPixelSize, [800, 600], 'onResize receives the previous pixel size');

  t.end();
});

test('CanvasContext#_observeDevicePixelRatio clamps to max texture size in css-dpr mode', t => {
  if (!isBrowser()) {
    t.end();
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
  t.deepEqual(
    canvasContext.getDevicePixelSize(),
    [2048, 2048],
    'initial size clamped by _handleResize'
  );

  // Now simulate a DPR change to 3 (4500x3600 unclamped)
  canvasContext.getDevicePixelRatio = () => 3;
  (canvasContext as any)._canvasObserver = {started: true};
  (canvasContext as any)._observeDevicePixelRatio();

  t.deepEqual(
    canvasContext.getDevicePixelSize(),
    [2048, 2048],
    'DPR change clamps pixel size to maxTextureDimension2D'
  );

  t.end();
});

test('CanvasContext#_startObservers defers DOM observation until explicitly started', t => {
  if (!isBrowser()) {
    t.end();
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

    t.equal(calls.resizeObserverObserve, 0, 'resize observer is not started during construction');
    t.equal(
      calls.intersectionObserverObserve,
      0,
      'intersection observer is not started during construction'
    );

    canvasContext._startObservers();

    t.equal(calls.resizeObserverObserve, 1, 'resize observer starts after explicit initialization');
    t.equal(
      calls.intersectionObserverObserve,
      1,
      'intersection observer starts after explicit initialization'
    );

    canvasContext.destroy();
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
  }

  t.end();
});

test('CanvasContext#_startObservers is idempotent', t => {
  if (!isBrowser()) {
    t.end();
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

    t.equal(calls.resizeObserverObserve, 1, 'resize observer only starts once');
    t.equal(calls.intersectionObserverObserve, 1, 'intersection observer only starts once');
    t.equal(calls.setTimeout, 1, 'deferred DPR observation is only scheduled once');

    canvasContext.destroy();
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
    globalScope.setTimeout = originalSetTimeout;
  }

  t.end();
});

test('CanvasContext#trackPosition polling stops on destroy', t => {
  if (!isBrowser()) {
    t.end();
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

    t.ok(intervalCallback, 'position polling interval is scheduled');
    intervalCallback?.();
    t.equal(updatePositionCalls, 1, 'position polling calls updatePosition while active');

    canvasContext.destroy();
    t.equal(clearIntervalCalls, 1, 'position polling interval is cleared on destroy');

    intervalCallback?.();
    t.equal(updatePositionCalls, 1, 'position polling no longer updates after destroy');
  } finally {
    globalScope.ResizeObserver = originalResizeObserver;
    globalScope.IntersectionObserver = originalIntersectionObserver;
    globalScope.setInterval = originalSetInterval;
    globalScope.clearInterval = originalClearInterval;
  }

  t.end();
});

test('PresentationContext#defined', t => {
  t.ok(PresentationContext, 'PresentationContext defined');
  t.end();
});

createContextSuite('CanvasContext', () => new TestCanvasContext());
createContextSuite('PresentationContext', () => new TestPresentationContext());

test('CanvasContext#destroy nulls device to catch later access', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const canvasContext = new TestCanvasContext();
  canvasContext.destroy();
  // @ts-expect-error
  t.equal(canvasContext.device, null, 'destroyed context device should be null');
  t.end();
});

test('CanvasContext#getDevicePixelRatio', async t => {
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
      t.equal(result, tc.expected, tc.name);
    });
  }
  t.end();
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

test('WebGLCanvasContext#cssToDevicePixels', async t => {
  // Create a fresh device since are going to modify it
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      const restoreCanvasContext = configureCanvasContext(canvasContext, tc);
      try {
        tc.windowPositions.forEach((wPos, i) => {
          // by default yInvert is true
          t.deepEqual(
            canvasContext?.cssToDevicePixels(tc.windowPositions[i]),
            tc.devicePositionsInverted[i],
            `${tc.name}(yInvert=true): device pixel should be ${JSON.stringify(
              tc.devicePositionsInverted[i]
            )} for window position ${tc.windowPositions[i]}`
          );
          t.deepEqual(
            canvasContext?.cssToDevicePixels(tc.windowPositions[i], false),
            tc.devicePositions[i],
            `${tc.name}(yInvert=false): device pixel should match`
          );
        });
      } finally {
        restoreCanvasContext();
      }
    }
  });
  t.end();
});

test('WebGLCanvasContext#cssToDeviceRatio', async t => {
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      const restoreCanvasContext = configureCanvasContext(canvasContext, tc);
      try {
        t.equal(
          canvasContext?.cssToDeviceRatio(),
          tc.ratio,
          'cssToDeviceRatio should return correct value'
        );
      } finally {
        restoreCanvasContext();
      }
    }
  });

  t.end();
});
