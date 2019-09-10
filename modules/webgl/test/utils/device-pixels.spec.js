/* global window */
import {cssToDevicePixels, cssToDeviceRatio, getDevicePixelRatio} from '@luma.gl/webgl/utils';
import test from 'tape-catch';
const LOW_DPR = 0.5;
const HIGH_DPR = 4;
const HIGH_DPR_FRACTION = 2.5;
const MAP_TEST_CASES = [
  {
    name: 'device pixel ratio 1',
    gl: {
      drawingBufferWidth: 10,
      drawingBufferHeight: 10,
      canvas: {
        clientWidth: 10,
        clientHeight: 10
      }
    },
    ratio: 1,
    windowPositions: [[0, 0], [2, 2], [9, 9]],
    devicePositionsInverted: [
      {
        low: [0, 9],
        high: [0, 9]
      },
      {
        low: [2, 7],
        high: [2, 7]
      },
      {
        low: [9, 0],
        high: [9, 0]
      }
    ],
    devicePositions: [
      {
        low: [0, 0],
        high: [0, 0]
      },
      {
        low: [2, 2],
        high: [2, 2]
      },
      {
        low: [9, 9],
        high: [9, 9]
      }
    ]
  },
  {
    name: 'device pixel ratio 1, 1X1 window',
    gl: {
      drawingBufferWidth: 1,
      drawingBufferHeight: 1,
      canvas: {
        clientWidth: 1,
        clientHeight: 1
      }
    },
    ratio: 1,
    windowPositions: [[0, 0]],
    devicePositionsInverted: [
      {
        low: [0, 0],
        high: [0, 0]
      }
    ],
    devicePositions: [
      {
        low: [0, 0],
        high: [0, 0]
      }
    ]
  },
  {
    name: 'device pixel ratio > 1',
    gl: {
      drawingBufferWidth: 10 * HIGH_DPR,
      drawingBufferHeight: 10 * HIGH_DPR,
      canvas: {
        clientWidth: 10,
        clientHeight: 10
      }
    },
    ratio: HIGH_DPR,
    yInvert: true,
    windowPositions: [[0, 0], [2, 2], [9, 9]],
    // 0 4 8 12 16 20 24 28 32 36 40
    // 0 1 2 3  4  5  6  7  8  9
    devicePositionsInverted: [
      {
        low: [0, 39],
        high: [3, 36]
      },
      {
        low: [8, 31],
        high: [11, 28]
      },
      {
        low: [36, 3],
        high: [39, 0]
      }
    ],
    devicePositions: [
      {
        low: [0, 0],
        high: [3, 3]
      },
      {
        low: [8, 8],
        high: [11, 11]
      },
      {
        low: [36, 36],
        high: [39, 39]
      }
    ]
  },
  {
    name: 'device pixel ratio > 1 (fraction)',
    gl: {
      drawingBufferWidth: 10 * HIGH_DPR_FRACTION,
      drawingBufferHeight: 10 * HIGH_DPR_FRACTION,
      canvas: {
        clientWidth: 10,
        clientHeight: 10
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
        low: [0, 24],
        high: [2, 22]
      },
      {
        low: [5, 19],
        high: [7, 17]
      },
      {
        low: [23, 1],
        high: [24, 0]
      }
    ],
    devicePositions: [
      {
        low: [0, 0],
        high: [2, 2]
      },
      {
        low: [5, 5],
        high: [7, 7]
      },
      {
        low: [23, 23],
        high: [24, 24]
      }
    ]
  },
  {
    name: 'device pixel ratio < 1',
    gl: {
      drawingBufferWidth: 10 * LOW_DPR,
      drawingBufferHeight: 10 * LOW_DPR,
      canvas: {
        clientWidth: 10,
        clientHeight: 10
      }
    },
    ratio: LOW_DPR,
    yInvert: true,
    windowPositions: [[0, 0], [2, 2], [8, 8]],
    devicePositionsInverted: [
      {
        low: [0, 4],
        high: [0, 4]
      },
      {
        low: [1, 3],
        high: [1, 3]
      },
      {
        low: [4, 0],
        high: [4, 0]
      }
    ],
    devicePositions: [
      {
        low: [0, 0],
        high: [0, 0]
      },
      {
        low: [1, 1],
        high: [1, 1]
      },
      {
        low: [4, 4],
        high: [4, 4]
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
  t.end();
});
