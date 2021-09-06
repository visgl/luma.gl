import test from 'tape-promise/tape';
import {Geometry} from '@luma.gl/engine';

const TEST_CASES = [
  {
    title: 'no attributes',
    props: undefined,
    shouldThrow: true
  },
  {
    title: 'simple positions',
    props: {
      attributes: {
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0])
      }
    },
    drawMode: Geometry.DRAW_MODE.TRIANGLES,
    vertexCount: 3
  },
  {
    title: 'invalid positions',
    props: {
      attributes: {
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0]
      }
    },
    shouldThrow: true
  },
  {
    title: 'with indices',
    props: {
      attributes: {
        indices: new Uint16Array([0, 1, 2]),
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0])
      }
    },
    drawMode: Geometry.DRAW_MODE.TRIANGLES,
    vertexCount: 3
  },
  {
    title: 'with too many indices',
    props: {
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
      indices: {value: new Uint16Array([0, 1, 2, 3]), isIndexed: true},
      attributes: {
        positions: {value: new Float32Array([0, 0, 1, 0, 1, 1, 1, 0]), size: 2}
      },
      drawMode: Geometry.DRAW_MODE.TRIANGLE_FAN,
      vertexCount: 3
    },
    drawMode: Geometry.DRAW_MODE.TRIANGLE_FAN,
    vertexCount: 3
  }
];

test('Geometry#constructor', (t) => {
  for (const testCase of TEST_CASES) {
    if (testCase.shouldThrow) {
      t.throws(() => new Geometry(testCase.props), `${testCase.title}: should throw`);
    } else {
      const geometry = new Geometry(testCase.props);

      t.is(geometry.mode, testCase.drawMode, `${testCase.title}: drawMode is correct`);
      t.is(
        geometry.getVertexCount(),
        testCase.vertexCount,
        `${testCase.title}: vertexCount is correct`
      );
    }
  }

  t.end();
});
