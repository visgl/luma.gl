// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeStudioEnvironmentMipLevels} from '../../examples/showcase/packet-spraying/optics';

it('packet-spraying builds a complete portable studio-environment reflection pyramid', () => {
  const levels = makeStudioEnvironmentMipLevels();

  expect(
    levels.map(level => [level.width, level.height]),
    'all environment levels are initialized down to a single rough-reflection texel'
  ).toEqual([
    [256, 128],
    [128, 64],
    [64, 32],
    [32, 16],
    [16, 8],
    [8, 4],
    [4, 2],
    [2, 1],
    [1, 1]
  ]);
  expect(
    Boolean(levels.every(level => level.pixels.length === level.width * level.height * 4)),
    'each mip level has a tightly packed portable RGBA upload'
  ).toBe(true);
  expect(
    Boolean(
      levels.every(level =>
        level.pixels.every((channel, index) => index % 4 !== 3 || channel === 255)
      )
    ),
    'studio environment coverage stays opaque across the complete pyramid'
  ).toBe(true);
  expect(
    Boolean(levels[0].pixels.some((channel, index) => index % 4 !== 3 && channel > 150)),
    'the base level preserves directional studio highlights'
  ).toBe(true);

  const finalLevel = levels[levels.length - 1];
  expect(
    Boolean(finalLevel.pixels[2] > finalLevel.pixels[0]),
    'fully rough reflection retains the cool studio lighting balance'
  ).toBe(true);
  void 0;
});

it('packet-spraying studio downsampling preserves averaged reflected light', () => {
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

          expect(
            currentLevel.pixels[(row * currentLevel.width + column) * 4 + channel],
            `level ${levelIndex} texel ${column},${row} channel ${channel} conserves studio light`
          ).toBe(Math.round(sourceTotal / 4));
        }
      }
    }
  }

  void 0;
});
