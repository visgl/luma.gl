// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('unpackIndexedGeometry', t => {
  for (const testCase of TEST_CASES) {
    const {attributes} = unpackIndexedGeometry(testCase.input);
    for (const name in testCase.output.attributes) {
      t.deepEqual(
        attributes[name],
        testCase.output.attributes[name],
        `${testCase.title}: ${name} matches`
      );
    }
  }

  t.end();
});

test('makeInterleavedGeometry', t => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {value: new Float32Array([0, 1, 2, 3, 4, 5]), size: 3},
      NORMAL: {value: new Float32Array([10, 11, 12, 13, 14, 15]), size: 3},
      TEXCOORD_0: {value: new Float32Array([20, 21, 22, 23]), size: 2}
    }
  });

  const interleavedGeometry = makeInterleavedGeometry(geometry);

  t.ok(interleavedGeometry instanceof Geometry, 'returns a Geometry');
  t.is(interleavedGeometry.vertexCount, 2, 'vertexCount is preserved');
  t.deepEqual(
    interleavedGeometry.bufferLayout,
    [
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
    ],
    'bufferLayout describes one interleaved geometry buffer'
  );
  t.deepEqual(
    Array.from(new Float32Array(interleavedGeometry.attributes.geometry.value.buffer)),
    [0, 1, 2, 10, 11, 12, 20, 21, 3, 4, 5, 13, 14, 15, 22, 23],
    'attributes are interleaved per vertex'
  );
  t.is(
    makeInterleavedGeometry(interleavedGeometry),
    interleavedGeometry,
    'interleaving is idempotent'
  );

  t.end();
});

test('makeInterleavedGeometry aligns mixed attribute types', t => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {value: new Float32Array([0, 1, 2, 3, 4, 5]), size: 3},
      COLOR_0: {value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), size: 4, normalized: true}
    }
  });

  const interleavedGeometry = makeInterleavedGeometry(geometry);
  const bytes = interleavedGeometry.attributes.geometry.value;

  t.ok(interleavedGeometry instanceof Geometry, 'returns a Geometry');
  t.deepEqual(
    interleavedGeometry.bufferLayout,
    [
      {
        name: 'geometry',
        stepMode: 'vertex',
        byteStride: 16,
        attributes: [
          {attribute: 'positions', format: 'float32x3', byteOffset: 0},
          {attribute: 'colors', format: 'unorm8x4', byteOffset: 12}
        ]
      }
    ],
    'mixed typed attributes are packed into a four-byte-aligned layout'
  );
  t.deepEqual(Array.from(bytes.slice(12, 16)), [1, 2, 3, 4], 'first color is aligned');
  t.deepEqual(Array.from(bytes.slice(28, 32)), [5, 6, 7, 8], 'second color is aligned');

  t.end();
});
