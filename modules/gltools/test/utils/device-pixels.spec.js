/* global window */
import {cssToDevicePixels, cssToDeviceRatio} from '@luma.gl/gltools';
import {getDevicePixelRatio} from '@luma.gl/gltools/utils/device-pixels';

import test from 'tape-catch';
const LOW_DPR = 0.5;
const HIGH_DPR = 4;
const HIGH_DPR_FRACTION = 2.5;
const MAP_TEST_CASES = [
  {
    name: 'device pixel ratio 1',
    /** @type {WebGLRenderingContext} */
    gl: {
      drawingBufferWidth: 10,
      drawingBufferHeight: 10,
      canvas: {}, // To emulate real context
      // @ts-ignore
      luma: {
        canvasSizeInfo: {
          clientWidth: 10,
          clientHeight: 10
        }
      }
    },
    ratio: 1,
    windowPositions: [[0, 0], [2, 2], [9, 9]],
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
    /** @type {WebGLRenderingContext} */
    gl: {
      drawingBufferWidth: 1,
      drawingBufferHeight: 1,
      canvas: {},
      // @ts-ignore
      luma: {
        canvasSizeInfo: {
          clientWidth: 1,
          clientHeight: 1
        }
      }
    },
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
    /** @type {WebGLRenderingContext} */
    gl: {
      drawingBufferWidth: 10 * HIGH_DPR,
      drawingBufferHeight: 10 * HIGH_DPR,
      canvas: {},
      // @ts-ignore
      luma: {
        canvasSizeInfo: {
          clientWidth: 10,
          clientHeight: 10
        }
      }
    },
    ratio: HIGH_DPR,
    yInvert: true,
    windowPositions: [[0, 0], [2, 2], [9, 9]],
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
    /** @type {WebGLRenderingContext} */
    gl: {
      drawingBufferWidth: 10 * HIGH_DPR_FRACTION,
      drawingBufferHeight: 10 * HIGH_DPR_FRACTION,
      canvas: {},
      // @ts-ignore
      luma: {
        canvasSizeInfo: {
          clientWidth: 10,
          clientHeight: 10
        }
      }
    },
    ratio: HIGH_DPR_FRACTION,
    yInvert: true,
    windowPositions: [[0, 0], [2, 2], [9, 9]],
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
    /** @type {WebGLRenderingContext} */
    gl: {
      drawingBufferWidth: 10 * LOW_DPR,
      drawingBufferHeight: 10 * LOW_DPR,
      canvas: {},
      // @ts-ignore
      luma: {
        canvasSizeInfo: {
          clientWidth: 10,
          clientHeight: 10
        }
      }
    },
    ratio: LOW_DPR,
    yInvert: true,
    windowPositions: [[0, 0], [1, 1], [2, 2], [8, 8]],
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

test('webgl#getDevicePixelRatio', t => {
  const windowPixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const TEST_CAES = [
    {
      name: 'useDevicePixels: true: should use window.devicePixelRatio or 1',
      useDevicePixels: true,
      expected: windowPixelRatio
    },
    {
      name: 'useDevicePixels: false: should use 1',
      useDevicePixels: false,
      expected: 1
    },
    {
      name: 'Non Finite useDevicePixels: should use 1',
      useDevicePixels: null,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels: should use 1',
      useDevicePixels: 0,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels: should use 1',
      useDevicePixels: -3.2,
      expected: 1
    },
    {
      name: 'Valid useDevicePixels, should use it',
      useDevicePixels: 1.5,
      expected: 1.5
    }
  ];

  TEST_CAES.forEach(tc => {
    t.equal(tc.expected, getDevicePixelRatio(tc.useDevicePixels), tc.name);
  });
  t.end();
});

test('webgl#cssToDevicePixels', t => {
  MAP_TEST_CASES.forEach(tc => {
    tc.windowPositions.forEach((wPos, i) => {
      // by default yInvert is true
      t.deepEqual(
        cssToDevicePixels(tc.gl, tc.windowPositions[i]),
        tc.devicePositionsInverted[i],
        `${tc.name}(yInvert=true): device pixel should be ${
          tc.devicePositionsInverted[i]
        } for window position ${tc.windowPositions[i]}`
      );
      t.deepEqual(
        cssToDevicePixels(tc.gl, tc.windowPositions[i], false),
        tc.devicePositions[i],
        `${tc.name}(yInvert=false): device pixel should match`
      );
    });
  });
  t.end();
});

test('webgl#cssToDeviceRatio', t => {
  MAP_TEST_CASES.forEach(tc => {
    t.equal(cssToDeviceRatio(tc.gl), tc.ratio, 'cssToDeviceRatio should return correct value');
  });

  const glWithNoCanvas = {};
  t.equal(
    // @ts-ignore
    cssToDeviceRatio(glWithNoCanvas),
    1,
    'cssToDeviceRatio should return 1 when there is no canvas'
  );
  t.end();
});
