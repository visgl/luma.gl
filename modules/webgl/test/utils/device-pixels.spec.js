import {getDevicePixelRatio, mapToDevicePosition} from '@luma.gl/webgl';
import test from 'tape-catch';

test('webgl#getDevicePixelRatio', t => {
  const TEST_CAES = [
    {
      name: 'Undefined windowPixelRatio, should use 1',
      useDevicePixels: true,
      expected: 1
    },
    {
      name: 'Use windowPixelRatio, should use it',
      useDevicePixels: true,
      windowPixelRatio: 2,
      expected: 2
    },
    {
      name: 'Use default pixel ratio, should use 1',
      useDevicePixels: false,
      windowPixelRatio: 2,
      expected: 1
    },
    {
      name: 'Non Finite useDevicePixels, should use 1',
      useDevicePixels: null,
      windowPixelRatio: 2,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels, should use 1',
      useDevicePixels: 0,
      windowPixelRatio: 2,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels, should use 1',
      useDevicePixels: -3.2,
      windowPixelRatio: 2,
      expected: 1
    },
    {
      name: 'Valid useDevicePixels, should use it',
      useDevicePixels: 4.5,
      windowPixelRatio: 2,
      expected: 4.5
    }
  ];

  TEST_CAES.forEach(tc => {
    t.equal(tc.expected, getDevicePixelRatio(tc.useDevicePixels, tc.windowPixelRatio), tc.name);
  });
  t.end();
});

test('webgl#mapToDevicePosition', t => {
  const LOW_DPR = 0.5;
  const HIGH_DPR = 4;
  const TEST_CASES = [
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
      windowPositions: [[0, 0], [2, 2], [9, 9]],
      devicePositionsInverted: [[0, 4], [1, 3], [4, 0]],
      devicePositions: [[0, 0], [1, 1], [4, 4]]
    }
  ];
  TEST_CASES.forEach(tc => {
    tc.windowPositions.forEach((wPos, i) => {
      // by default yInvert is true
      t.deepEqual(
        mapToDevicePosition(tc.windowPositions[i], tc.gl),
        tc.devicePositionsInverted[i],
        `${tc.name}(yInvert=true): device pixel should be ${
          tc.devicePositionsInverted[i]
        } for window position ${tc.windowPositions[i]}`
      );
      t.deepEqual(
        mapToDevicePosition(tc.windowPositions[i], tc.gl, false),
        tc.devicePositions[i],
        `${tc.name}(yInvert=false): device pixel should match`
      );
    });
  });
  t.end();
});
