// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GPURigidBodyWorld,
  makeRigidBodyHeightField,
  makeTriangleMeshGeometry
} from '../../src/gpu-physics';
import {packRigidBodyHeightField} from '../../src/gpu-physics/rigid-body-height-field';

it('converts a cell-registered math.gl grid in double precision before native packing', () => {
  const heights = new Float64Array([101, 102, 103, 104]);
  const validity = new Uint8Array([1, 1, 1, 0]);
  const field = makeRigidBodyHeightField(
    {
      width: 2,
      height: 2,
      origin: [1e9, 2e9],
      columnStep: [0.5, 0],
      rowStep: [0.25, 0.5],
      registration: 'cell',
      diagonal: '10-01',
      copyData: () => ({heights: heights.slice(), validity: validity.slice()})
    },
    [1e9, 2e9, 100]
  );
  expect(field.origin).toEqual([0.375, 0.25]);
  expect([...field.heights!]).toEqual([1, 2, 3, 4]);
  expect(field.validity).toEqual(validity);
  expect(heights[0]).toBe(101);
  const packed = packRigidBodyHeightField(field);
  expect(packed.nodeCount).toBe(1);
  expect(packed.extent[2]).toBe(3);
  const evicted = packRigidBodyHeightField({...field, heights: undefined});
  expect(evicted.nodeCount).toBe(0);
  expect(evicted.data.length).toBe(packed.data.length);
  expect(() => packRigidBodyHeightField({...field, rowStep: [0.5, 0]})).toThrow(
    'Invalid height-field transform'
  );
  expect(() => packRigidBodyHeightField({...field, validity: new Uint8Array(3)})).toThrow(
    'Invalid height-field grid'
  );
});

it('uses substantially less geometry storage than the same authored triangle mesh', () => {
  const width = 65;
  const heights = new Float32Array(width * width);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < width; row++) {
    for (let column = 0; column < width; column++) {
      const vertex = row * width + column;
      heights[vertex] = Math.sin(column / 8) * Math.cos(row / 8);
      positions.push(column, row, heights[vertex]);
      if (row + 1 < width && column + 1 < width) {
        indices.push(
          vertex,
          vertex + 1,
          vertex + width,
          vertex + 1,
          vertex + width + 1,
          vertex + width
        );
      }
    }
  }
  const native = new GPURigidBodyWorld({
    bodies: [
      {
        mass: 0,
        position: [0, 0, 0],
        shape: {type: 'height-field', field: {width, height: width, heights, diagonal: '10-01'}}
      }
    ]
  });
  const reference = new GPURigidBodyWorld({
    bodies: [
      {
        mass: 0,
        position: [0, 0, 0],
        shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)}
      }
    ]
  });
  try {
    const nativeBytes = native
      .getCapacityInfo()
      .buffers.find(buffer => buffer.name === 'bodies')!.byteLength;
    const referenceBytes = reference
      .getCapacityInfo()
      .buffers.find(buffer => buffer.name === 'bodies')!.byteLength;
    expect(nativeBytes).toBeLessThan(referenceBytes / 4);
    expect(
      () =>
        new GPURigidBodyWorld({
          bodies: [
            {
              position: [0, 0, 0],
              shape: {type: 'height-field', field: {width, height: width, heights}}
            }
          ]
        })
    ).toThrow('Height fields require static bodies');
  } finally {
    native.destroy();
    reference.destroy();
  }
});
