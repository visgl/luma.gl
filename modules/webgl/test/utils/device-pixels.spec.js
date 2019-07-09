/* global window */
import {getDevicePixelRatio, cssToDevicePixels, deviceToCssPixels} from '@luma.gl/webgl';
import test from 'tape-catch';
const LOW_DPR = 0.5;
const HIGH_DPR = 4;
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
    devicePositionsInverted: [[0, 9], [2, 7], [9, 0]],
    devicePositions: [[0, 0], [2, 2], [9, 9]]
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
    devicePositionsInverted: [[0, 36], [8, 28], [36, 0]],
    devicePositions: [[0, 0], [8, 8], [36, 36]]
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
    // css to device 0 - 8/9 => 0 - 4
    // device to css 0 - 4  => 0 - 8
    // Inverted device to css 0 - 4  => 8 - 0
    windowPositions: [[0, 0], [2, 2], [8, 8]],
    devicePositionsInverted: [[0, 4], [1, 3], [4, 0]],
    devicePositions: [[0, 0], [1, 1], [4, 4]]
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
      name: 'Use default pixel ratio: should use 1',
      useDevicePixels: false,
      expected: 1
    },
    {
      name: 'Non Finite useDevicePixels: should use window.devicePixelRatio or 1',
      useDevicePixels: null,
      expected: windowPixelRatio
    },
    {
      name: 'Non valid useDevicePixels: should use window.devicePixelRatio or 1',
      useDevicePixels: 0,
      expected: windowPixelRatio
    },
    {
      name: 'Non valid useDevicePixels: should use window.devicePixelRatio or 1',
      useDevicePixels: -3.2,
      expected: windowPixelRatio
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

test('webgl#deviceToCssPixels', t => {
  MAP_TEST_CASES.forEach(tc => {
    tc.devicePositionsInverted.forEach((dPos, i) => {
      // by default yInvert is true
      t.deepEqual(
        deviceToCssPixels(tc.gl, dPos),
        tc.windowPositions[i],
        `${tc.name}(yInvert=true): device pixel should be ${
          tc.windowPositions[i]
        } for device position ${dPos}`
      );
      t.deepEqual(
        deviceToCssPixels(tc.gl, tc.devicePositions[i], false),
        tc.windowPositions[i],
        `${tc.name}(yInvert=false): device pixel should match`
      );
    });
  });
  t.end();
});
