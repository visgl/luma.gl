// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {makeStudioEnvironmentMipLevels} from '../../examples/showcase/packet-spraying/optics';

test('packet-spraying builds a complete portable studio-environment reflection pyramid', testCase => {
  const levels = makeStudioEnvironmentMipLevels();

  testCase.deepEqual(
    levels.map(level => [level.width, level.height]),
    [
      [256, 128],
      [128, 64],
      [64, 32],
      [32, 16],
      [16, 8],
      [8, 4],
      [4, 2],
      [2, 1],
      [1, 1]
    ],
    'all environment levels are initialized down to a single rough-reflection texel'
  );
  testCase.ok(
    levels.every(level => level.pixels.length === level.width * level.height * 4),
    'each mip level has a tightly packed portable RGBA upload'
  );
  testCase.ok(
    levels.every(level =>
      level.pixels.every((channel, index) => index % 4 !== 3 || channel === 255)
    ),
    'studio environment coverage stays opaque across the complete pyramid'
  );
  testCase.ok(
    levels[0].pixels.some((channel, index) => index % 4 !== 3 && channel > 150),
    'the base level preserves directional studio highlights'
  );

  const finalLevel = levels[levels.length - 1];
  testCase.ok(
    finalLevel.pixels[2] > finalLevel.pixels[0],
    'fully rough reflection retains the cool studio lighting balance'
  );
  testCase.end();
});

test('packet-spraying studio downsampling preserves averaged reflected light', testCase => {
  const levels = makeStudioEnvironmentMipLevels(8, 4);

  for (let levelIndex = 1; levelIndex < levels.length; levelIndex++) {
    const previousLevel = levels[levelIndex - 1];
    const currentLevel = levels[levelIndex];
    for (let row = 0; row < currentLevel.height; row++) {
      for (let column = 0; column < currentLevel.width; column++) {
        for (let channel = 0; channel < 4; channel++) {
          let sourceTotal = 0;
          for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
            const sourceRow = Math.min(row * 2 + rowOffset, previousLevel.height - 1);
            for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
              const sourceColumn = (column * 2 + columnOffset) % previousLevel.width;
              sourceTotal +=
                previousLevel.pixels[
                  (sourceRow * previousLevel.width + sourceColumn) * 4 + channel
                ];
            }
          }

          testCase.equal(
            currentLevel.pixels[(row * currentLevel.width + column) * 4 + channel],
            Math.round(sourceTotal / 4),
            `level ${levelIndex} texel ${column},${row} channel ${channel} conserves studio light`
          );
        }
      }
    }
  }

  testCase.end();
});
