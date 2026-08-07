// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {
  getTemporalAntialiasingJitter,
  makeJitteredProjectionMatrix
} from '../src/anari-rendering-runtime';

describe('ANARI raster temporal antialiasing', () => {
  test('uses a bounded repeating Halton sequence in UV units', () => {
    expect(getTemporalAntialiasingJitter(0, 8, 12)).toEqual([0, -1 / 72]);
    expect(getTemporalAntialiasingJitter(8, 8, 12)).toEqual(
      getTemporalAntialiasingJitter(0, 8, 12)
    );

    for (let frameIndex = 0; frameIndex < 8; frameIndex++) {
      const jitter = getTemporalAntialiasingJitter(frameIndex, 8, 12);
      expect(Math.abs(jitter[0])).toBeLessThanOrEqual(0.5 / 8);
      expect(Math.abs(jitter[1])).toBeLessThanOrEqual(0.5 / 12);
    }
  });

  test('jitter-copies projection rows without mutating the unjittered camera', () => {
    const projectionMatrix = new Matrix4();
    const jitteredProjectionMatrix = makeJitteredProjectionMatrix(projectionMatrix, [
      1 / 8,
      -1 / 16
    ]);

    expect(Array.from(projectionMatrix)).toEqual(Array.from(new Matrix4()));
    expect(jitteredProjectionMatrix[12]).toBeCloseTo(0.25);
    expect(jitteredProjectionMatrix[13]).toBeCloseTo(0.125);
    expect(jitteredProjectionMatrix[15]).toBe(1);
  });
});
