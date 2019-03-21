import test from 'tape-catch';
import GL from '@luma.gl/constants';
import {Accessor} from '@luma.gl/webgl';
import {DEFAULT_ACCESSOR_VALUES} from '@luma.gl/webgl/classes/accessor';

const TEST_CASES_FOR_CONSTRUCTOR = [
  {
    accessors: [{divisor: 1}],
    result: {divisor: 1}
  },
  {
    accessors: [{divisor: 1}, {divisor: 0}],
    result: {divisor: 0}
  }
];

const TEST_CASES_FOR_RESOLVE = [
  {
    accessors: [{size: 2, type: GL.FLOAT}, {divisor: 1}],
    result: Object.assign({}, DEFAULT_ACCESSOR_VALUES, {
      size: 2,
      type: GL.FLOAT,
      divisor: 1
    })
  }
];

test('Accessor#import', t => {
  t.ok(Accessor, 'Accessor import successful');
  t.end();
});

test('Accessor#construct', t => {
  for (const tc of TEST_CASES_FOR_CONSTRUCTOR) {
    const accessor = new Accessor(...tc.accessors);
    t.deepEquals(accessor, tc.result, 'Accessor constructed correctly');
  }

  t.end();
});

test('Accessor#resolve', t => {
  for (const tc of TEST_CASES_FOR_RESOLVE) {
    const accessor = Accessor.resolve(...tc.accessors);
    t.deepEquals(accessor, tc.result, 'Accessor resolved correctly');
  }

  t.end();
});
