// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  decodeMorphTargetAttribute,
  Geometry,
  makeInterleavedGeometry,
  type Model,
  updateMorphTargetBuffers
} from '@luma.gl/engine';
import {describe, expect, test} from 'vitest';

describe('normalized morph-target vertex attributes', () => {
  test('decodes unsigned, signed minimum, and non-normalized integer source values', () => {
    expect(
      Array.from(
        decodeMorphTargetAttribute({
          size: 3,
          value: new Uint16Array([0, 32768, 65535]),
          normalized: true
        })
      )
    ).toEqual([0, expect.closeTo(32768 / 65535, 5), 1]);

    expect(
      Array.from(
        decodeMorphTargetAttribute({
          size: 4,
          value: new Int8Array([-128, -127, 0, 127]),
          normalized: true
        })
      )
    ).toEqual([-1, -1, 0, 1]);

    expect(
      Array.from(
        decodeMorphTargetAttribute({
          size: 3,
          value: new Uint16Array([2, 7, 1024]),
          normalized: false
        })
      )
    ).toEqual([2, 7, 1024]);
  });

  test('morphs preexisting normalized integer buffers without changing their packed layout', () => {
    const positions = new Uint16Array([16384, 32768, 49151]);
    const normals = new Int8Array([0, 0, 127]);
    const geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {size: 3, value: positions, normalized: true},
        NORMAL: {size: 3, value: normals, normalized: true}
      }
    });
    const sourcePacked = makeInterleavedGeometry(geometry);
    const writes: Uint8Array[] = [];
    const packedBuffer = {
      write(values: ArrayBufferView) {
        writes.push(
          new Uint8Array(
            values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength)
          )
        );
      }
    };
    const model = {
      _gpuGeometry: {attributes: {geometry: packedBuffer}},
      bufferAttributes: {geometry: packedBuffer}
    } as unknown as Model;

    updateMorphTargetBuffers(
      model,
      geometry,
      [
        {
          POSITION: new Float32Array([0.25, 0, 0]),
          NORMAL: new Float32Array([1, 0, 0])
        }
      ],
      [1]
    );

    expect(writes).toHaveLength(1);
    expect(writes[0].byteLength).toBe(sourcePacked.attributes['geometry']!.value.byteLength);
    const packedValues = new DataView(writes[0].buffer);
    expect(packedValues.getUint16(0, true)).toBeCloseTo(32768, -1);
    expect(packedValues.getInt8(8)).toBeCloseTo(90, -1);
    expect(packedValues.getInt8(10)).toBeCloseTo(90, -1);
    expect(Array.from(positions)).toEqual([16384, 32768, 49151]);
    expect(Array.from(normals)).toEqual([0, 0, 127]);
  });
});
