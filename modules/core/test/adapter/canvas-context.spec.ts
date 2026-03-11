// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {CanvasContext, Framebuffer} from '@luma.gl/core';
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
      onVisibilityChange: () => {}
    }
  };
  getCurrentFramebuffer(): Framebuffer {
    throw new Error('test');
  }
  updateSize() {}
  protected override _configureDevice(): void {
    // Mock update device
  }
}

/** Mock function: Modify the canvas context to mock test conditions */
function configureCanvasContext(canvasContext_: CanvasContext, tc) {
  // @ts-expect-error read only
  canvasContext_._canvasSizeInfo = tc._canvasSizeInfo;
  canvasContext_.getDrawingBufferSize = () => [tc.drawingBufferWidth, tc.drawingBufferHeight];
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

test.skip('WebGLCanvasContext#cssToDevicePixels', async t => {
  // Create a fresh device since are going to modify it
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      configureCanvasContext(canvasContext, tc);
    }
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
  });
  t.end();
});

test.skip('WebGLCanvasContext#cssToDeviceRatio', async t => {
  const canvasContextDevice = await getWebGLTestDevice();
  const canvasContext = canvasContextDevice?.canvasContext;

  MAP_TEST_CASES.forEach(tc => {
    if (canvasContext) {
      configureCanvasContext(canvasContext, tc);
    }
    t.equal(
      canvasContext?.cssToDeviceRatio(),
      tc.ratio,
      'cssToDeviceRatio should return correct value'
    );
  });

  t.end();
});
