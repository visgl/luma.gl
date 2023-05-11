import test from 'tape-promise/tape';
import {unpackIndexedGeometry} from '@luma.gl/engine/geometry/geometry-utils';

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

test('unpackIndexedGeometry', (t) => {
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
