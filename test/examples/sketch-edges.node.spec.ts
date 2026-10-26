// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {makeBuildings, makeEdges} from '../../examples/deck/sketch-edges/building-data';

test('building edge seeds survive reordering while picking indices follow the data', () => {
  const features = makeBuildings();
  const original = makeEdges(features);
  const reversed = makeEdges([...features].reverse());
  expect(original.length).toBe(features.length * 12 * 8);
  for (let row = 0; row < features.length; row++) {
    for (let edge = 0; edge < 12; edge++) {
      const originalOffset = (row * 12 + edge) * 8;
      const reversedOffset = ((features.length - row - 1) * 12 + edge) * 8;
      expect(reversed.slice(reversedOffset, reversedOffset + 6)).toEqual(
        original.slice(originalOffset, originalOffset + 6)
      );
      expect(reversed[reversedOffset + 6]).toBe(features.length - row - 1);
      expect(reversed[reversedOffset + 7]).toBe(original[originalOffset + 7]);
      const start = original.slice(originalOffset, originalOffset + 3);
      const end = original.slice(originalOffset + 3, originalOffset + 6);
      expect(start.filter((coordinate, axis) => coordinate !== end[axis]).length).toBe(1);
    }
  }
});
