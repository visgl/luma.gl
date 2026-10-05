// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import type {Device} from '@luma.gl/core';
import {Model} from '../../src/model/model';
import {NullDevice} from '@luma.gl/test-utils';
import {Geometry} from '../../src/geometry/geometry';
import {ClipSpace} from '../../src/models/clip-space';

it('ClipSpace preserves the quad default and interpolates identical coordinates for both geometries', () => {
  const device: Device = new NullDevice({});
  const setGeometry = vi.spyOn(Model.prototype, 'setGeometry');
  try {
    for (const geometryType of [undefined, 'quad', 'triangle'] as const) {
      const model = new ClipSpace(device, {
        geometryType,
        fs: '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }'
      });
      const geometry = setGeometry.mock.lastCall![0];
      if (!(geometry instanceof Geometry)) {
        throw new Error('Expected CPU geometry');
      }
      expect(model.vertexCount).toBe(geometryType === 'triangle' ? 3 : 4);
      expect(geometry.topology).toBe(
        geometryType === 'triangle' ? 'triangle-list' : 'triangle-strip'
      );
      model.destroy();
      // Geometry retains the CPU attributes for inspecting interpolation independently of rasterization.
      const attributes = geometry.attributes;
      const positions = attributes['clipSpacePositions']!.value!;
      const textureCoordinates = attributes['texCoords']!.value!;
      expect(attributes['coordinates']!.value).toEqual(textureCoordinates);
      const triangles =
        geometryType === 'triangle'
          ? [[0, 1, 2]]
          : [
              [0, 1, 2],
              [2, 1, 3]
            ];
      for (const horizontal of [-1, -0.5, 0, 0.5, 1]) {
        for (const vertical of [-1, -0.5, 0, 0.5, 1]) {
          let covered = false;
          for (const [first, second, third] of triangles) {
            const firstHorizontal = positions[first * 2];
            const firstVertical = positions[first * 2 + 1];
            const secondHorizontal = positions[second * 2];
            const secondVertical = positions[second * 2 + 1];
            const thirdHorizontal = positions[third * 2];
            const thirdVertical = positions[third * 2 + 1];
            const area =
              (secondHorizontal - firstHorizontal) * (thirdVertical - firstVertical) -
              (secondVertical - firstVertical) * (thirdHorizontal - firstHorizontal);
            expect(area).toBeGreaterThan(0);
            const secondWeight =
              ((horizontal - firstHorizontal) * (thirdVertical - firstVertical) -
                (vertical - firstVertical) * (thirdHorizontal - firstHorizontal)) /
              area;
            const thirdWeight =
              ((secondHorizontal - firstHorizontal) * (vertical - firstVertical) -
                (secondVertical - firstVertical) * (horizontal - firstHorizontal)) /
              area;
            const firstWeight = 1 - secondWeight - thirdWeight;
            if (Math.min(firstWeight, secondWeight, thirdWeight) >= 0) {
              covered = true;
              expect(
                firstWeight * textureCoordinates[first * 2] +
                  secondWeight * textureCoordinates[second * 2] +
                  thirdWeight * textureCoordinates[third * 2]
              ).toBeCloseTo((horizontal + 1) / 2);
              expect(
                firstWeight * textureCoordinates[first * 2 + 1] +
                  secondWeight * textureCoordinates[second * 2 + 1] +
                  thirdWeight * textureCoordinates[third * 2 + 1]
              ).toBeCloseTo((vertical + 1) / 2);
            }
          }
          expect(covered).toBe(true);
        }
      }
    }
  } finally {
    setGeometry.mockRestore();
    device.destroy();
  }
});
