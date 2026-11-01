// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {makeGPUSplatData, SplatRenderer} from '@luma.gl/engine/splats';

// Regression: https://github.com/LTplus-AG/ifc-lite/discussions/8141
// Actual renderer ordering, including cached camera-independent prop updates.
for (const orthographic of [false, true]) {
  it(`orders reverse-Z ${orthographic ? 'orthographic' : 'perspective'} splats back to front`, () => {
    const device = new NullDevice({});
    const data = makeGPUSplatData(device, {
      positions: new Float32Array([0, 0, -2, 0, 0, -4]),
      scales: new Float32Array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
      rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0]),
      colors: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
      opacities: new Float32Array([0.75, 0.75])
    });
    const matrix = orthographic
      ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 / 99.9, 0, 0, 0, 100 / 99.9, 1]
      : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0.1, 0];
    const renderer = new SplatRenderer(device, {
      data,
      modelViewProjectionMatrix: matrix,
      viewportSize: [64, 64],
      depthCompare: 'greater',
      depthConvention: 'reverse'
    });
    try {
      expect(Array.from(renderer.getSortedIndices())).toEqual([1, 0]);
      renderer.setProps({depthConvention: 'standard'});
      expect(Array.from(renderer.getSortedIndices())).toEqual([0, 1]);
      renderer.setProps({depthConvention: 'reverse'});
      expect(Array.from(renderer.getSortedIndices())).toEqual([1, 0]);
      renderer.setProps({sortMode: 'none'});
      expect(Array.from(renderer.getSortedIndices())).toEqual([0, 1]);
      // Conventional projection keeps the existing far-first semantics.
      for (let columnIndex = 0; columnIndex < 4; columnIndex++)
        matrix[columnIndex * 4 + 2] = matrix[columnIndex * 4 + 3] - matrix[columnIndex * 4 + 2];
      renderer.setProps({
        modelViewProjectionMatrix: matrix,
        depthConvention: 'standard',
        sortMode: 'global'
      });
      expect(Array.from(renderer.getSortedIndices())).toEqual([1, 0]);
    } finally {
      renderer.destroy();
      data.destroy();
      device.destroy();
    }
  });
}

for (const rowCount of [4, 8192]) {
  it(`preserves equal-depth ties and standard defaults for ${rowCount} rows`, () => {
    const device = new NullDevice({});
    const positions = new Float32Array(rowCount * 3);
    const rotations = new Float32Array(rowCount * 4);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      positions[rowIndex * 3 + 2] = Math.floor(rowIndex / 2) / rowCount;
      rotations[rowIndex * 4] = 1;
    }
    const data = makeGPUSplatData(device, {
      positions,
      rotations,
      scales: new Float32Array(rowCount * 3).fill(0.1),
      colors: new Uint8Array(rowCount * 4).fill(255),
      opacities: new Float32Array(rowCount).fill(0.75)
    });
    const renderer = new SplatRenderer(device, {data, viewportSize: [64, 64]});
    try {
      const standardOrder: number[] = [];
      for (let pairIndex = rowCount / 2 - 1; pairIndex >= 0; pairIndex--) {
        standardOrder.push(pairIndex * 2, pairIndex * 2 + 1);
      }
      expect(Array.from(renderer.getSortedIndices())).toEqual(standardOrder);
      renderer.setProps({depthConvention: 'reverse'});
      expect(Array.from(renderer.getSortedIndices())).toEqual(
        Array.from({length: rowCount}, (_, rowIndex) => rowIndex)
      );
      renderer.setProps({depthConvention: 'standard'});
      expect(Array.from(renderer.getSortedIndices())).toEqual(standardOrder);
    } finally {
      renderer.destroy();
      data.destroy();
      device.destroy();
    }
  });
}
