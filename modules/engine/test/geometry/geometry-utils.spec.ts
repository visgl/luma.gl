// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Geometry} from '@luma.gl/engine';
import {
  makeInterleavedGeometry,
  unpackIndexedGeometry
} from '@luma.gl/engine/geometry/geometry-utils';

const TEST_ATTRIBUTES = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0]), size: 3},
  NORMAL: {value: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), size: 3},
  TEXCOORD_0: {value: new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), size: 2},
  COLOR: {constant: true, value: new Float32Array([255, 255, 255]), size: 3}
};

const TEST_CASES = [
  {
    title: 'no indices',
    input: {
      attributes: TEST_ATTRIBUTES
    },
    output: {
      attributes: TEST_ATTRIBUTES
    }
  },
  {
    title: 'with indices',
    input: {
      indices: {value: new Uint16Array([0, 1, 2, 3, 1, 2])},
      attributes: TEST_ATTRIBUTES
    },
    output: {
      attributes: {
        POSITION: {
          value: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0]),
          size: 3
        },
        NORMAL: {
          value: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
          size: 3
        },
        TEXCOORD_0: {value: new Float32Array([0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1]), size: 2},
        COLOR: TEST_ATTRIBUTES.COLOR
      }
    }
  }
];

it('unpackIndexedGeometry', () => {
  for (const testCase of TEST_CASES) {
    const {attributes} = unpackIndexedGeometry(testCase.input);
    for (const name in testCase.output.attributes) {
      expect(attributes[name], `${testCase.title}: ${name} matches`).toEqual(
        testCase.output.attributes[name]
      );
    }
  }
});

it('makeInterleavedGeometry', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {value: new Float32Array([0, 1, 2, 3, 4, 5]), size: 3},
      NORMAL: {value: new Float32Array([10, 11, 12, 13, 14, 15]), size: 3},
      TEXCOORD_0: {value: new Float32Array([20, 21, 22, 23]), size: 2}
    }
  });

  const interleavedGeometry = makeInterleavedGeometry(geometry);

  expect(interleavedGeometry instanceof Geometry, 'returns a Geometry').toBe(true);
  expect(interleavedGeometry.vertexCount, 'vertexCount is preserved').toBe(2);
  expect(
    interleavedGeometry.bufferLayout,
    'bufferLayout describes one interleaved geometry buffer'
  ).toEqual([
    {
      name: 'geometry',
      stepMode: 'vertex',
      byteStride: 32,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'normals', format: 'float32x3', byteOffset: 12},
        {attribute: 'texCoords', format: 'float32x2', byteOffset: 24}
      ]
    }
  ]);
  expect(
    Array.from(new Float32Array(interleavedGeometry.attributes.geometry.value.buffer)),
    'attributes are interleaved per vertex'
  ).toEqual([0, 1, 2, 10, 11, 12, 20, 21, 3, 4, 5, 13, 14, 15, 22, 23]);
  expect(makeInterleavedGeometry(interleavedGeometry), 'interleaving is idempotent').toBe(
    interleavedGeometry
  );
});

it('makeInterleavedGeometry aligns mixed attribute types', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {value: new Float32Array([0, 1, 2, 3, 4, 5]), size: 3},
      COLOR_0: {value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), size: 4, normalized: true}
    }
  });

  const interleavedGeometry = makeInterleavedGeometry(geometry);
  const bytes = interleavedGeometry.attributes.geometry.value;

  expect(interleavedGeometry instanceof Geometry, 'returns a Geometry').toBe(true);
  expect(
    interleavedGeometry.bufferLayout,
    'mixed typed attributes are packed into a four-byte-aligned layout'
  ).toEqual([
    {
      name: 'geometry',
      stepMode: 'vertex',
      byteStride: 16,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'colors', format: 'unorm8x4', byteOffset: 12}
      ]
    }
  ]);
  expect(Array.from(bytes.slice(12, 16)), 'first color is aligned').toEqual([1, 2, 3, 4]);
  expect(Array.from(bytes.slice(28, 32)), 'second color is aligned').toEqual([5, 6, 7, 8]);
});
