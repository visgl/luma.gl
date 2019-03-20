import test from 'tape-catch';
import {deepArrayEqual} from '@luma.gl/webgl-state-tracker/utils';

test('WebGLState#deepArrayEqual', t => {
  // TODO - what happened with our test cases??
  const TEST_CASES = [
    {title: 'null', x: null, y: null, result: true},
    {title: 'number', x: null, y: null, result: true},
    {title: 'shallow-equal array 1', x: null, y: null, result: true},
    {title: 'deep-equal array', x: null, y: null, result: true},
    {title: 'deep-equal array/typed array', x: null, y: null, result: true},
    {title: 'different arrays', x: null, y: null, result: true}
  ];

  for (const tc of TEST_CASES) {
    t.equals(deepArrayEqual(tc.x, tc.y), tc.result, tc.title);
  }
  t.end();
});
