// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Geometry, GeometryProps} from '@luma.gl/engine';
import {TypedArray} from '@math.gl/types';

const TEST_CASES: {title: string; props: GeometryProps; [key: string]: any}[] = [
  {
    title: 'simple positions',
    props: {
      topology: 'triangle-list',
      attributes: {
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0])
      }
    },
    topology: 'triangle-list',
    vertexCount: 3,
    bufferLayout: [{name: 'positions', format: 'float32x3'}]
  },
  {
    title: 'invalid positions',
    props: {
      topology: 'triangle-list',
      attributes: {
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0] as unknown as TypedArray
      }
    },
    shouldThrow: true
  },
  {
    title: 'with indices',
    props: {
      topology: 'triangle-list',
      attributes: {
        indices: new Uint16Array([0, 1, 2]),
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0])
      }
    },
    topology: 'triangle-list',
    vertexCount: 3,
    bufferLayout: [{name: 'positions', format: 'float32x3'}]
  },
  {
    title: 'with too many indices',
    props: {
      topology: 'triangle-list',
      indices: new Uint16Array([0, 1, 2, 3]),
      attributes: {
        indices: new Uint16Array([0, 1, 2]),
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0])
      }
    },
    shouldThrow: true
  },
  {
    title: 'attribute descriptors',
    props: {
      topology: 'triangle-strip',
      indices: {value: new Uint16Array([0, 1, 2, 3]), isIndexed: true},
      attributes: {
        positions: {value: new Float32Array([0, 0, 1, 0, 1, 1, 1, 0]), size: 2}
      },
      vertexCount: 3
    },
    topology: 'triangle-strip',
    vertexCount: 3,
    bufferLayout: [{name: 'positions', format: 'float32x2'}]
  }
];

test('Geometry#constructor', t => {
  for (const testCase of TEST_CASES) {
    if (testCase.shouldThrow) {
      t.throws(() => new Geometry(testCase.props), `${testCase.title}: should throw`);
    } else {
      const geometry = new Geometry(testCase.props);

      t.is(geometry.topology, testCase.topology, `${testCase.title}: topology is correct`);
      t.is(
        geometry.getVertexCount(),
        testCase.vertexCount,
        `${testCase.title}: vertexCount is correct`
      );
      t.deepEqual(
        geometry.bufferLayout,
        testCase.bufferLayout,
        `${testCase.title}: bufferLayout is correct`
      );
    }
  }

  t.end();
});

test('Geometry#constructor normalizes explicit bufferLayout', t => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {value: new Float32Array([0, 0, 0]), size: 3}
    },
    bufferLayout: [{name: 'POSITION', format: 'float32x3'}]
  });

  t.ok(geometry.attributes.positions, 'attribute name is normalized');
  t.deepEqual(
    geometry.bufferLayout,
    [{name: 'positions', format: 'float32x3'}],
    'shorthand bufferLayout name is normalized'
  );
  t.end();
});
