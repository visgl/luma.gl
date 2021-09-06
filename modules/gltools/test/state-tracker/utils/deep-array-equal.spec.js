import test from 'tape-promise/tape';
import {deepArrayEqual} from '@luma.gl/gltools/utils/utils';

test('WebGLState#deepArrayEqual', (t) => {
  const ARRAY = [0, 1, 2];

  const TEST_CASES = [
    {title: 'null', x: null, y: null, result: true},
    {title: 'number', x: 1, y: 1, result: true},
    {title: 'number not equal', x: 1, y: 2, result: false},
    {title: 'shallow-equal array 1', x: ARRAY, y: ARRAY, result: true},
    {title: 'deep-equal array', x: ARRAY, y: [0, 1, 2], result: true},
    {
      title: 'deep-equal array/typed array',
      x: new Float32Array(ARRAY),
      y: new Float32Array(ARRAY),
      result: true
    },
    {title: 'different arrays', x: [0, 1], y: [0, 2], result: false}
  ];

  for (const tc of TEST_CASES) {
    t.equals(deepArrayEqual(tc.x, tc.y), tc.result, tc.title);
  }
  t.end();
});
