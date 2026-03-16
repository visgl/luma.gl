// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {arrayEqual} from '../../src/utils/array-equal';

test('arrayEqual compares small number arrays by value', t => {
  t.ok(arrayEqual([1, 2, 3], [1, 2, 3]), 'small number arrays with equal values compare equal');
  t.notOk(
    arrayEqual([1, 2, 3], [1, 2, 4]),
    'small number arrays with different values compare unequal'
  );
  t.ok(
    arrayEqual(new Float32Array([1, 2, 3]), new Float32Array([1, 2, 3])),
    'small typed arrays with equal values compare equal'
  );
  t.notOk(
    arrayEqual(new Float32Array([1, 2, 3]), new Float32Array([1, 2, 4])),
    'small typed arrays with different values compare unequal'
  );
  t.end();
});

test('arrayEqual avoids element-wise comparison for large arrays unless references match', t => {
  const largeArray = Array.from({length: 17}, (_, index) => index);

  t.ok(arrayEqual(largeArray, largeArray), 'same large array reference compares equal');
  t.notOk(
    arrayEqual(largeArray, Array.from({length: 17}, (_, index) => index)),
    'distinct large arrays do not trigger element-wise comparison by default'
  );
  t.notOk(
    arrayEqual(
      new Float32Array(Array.from({length: 129}, (_, index) => index)),
      new Float32Array(Array.from({length: 129}, (_, index) => index)),
      256
    ),
    'distinct typed arrays above the hard compare cap do not trigger element-wise comparison'
  );
  t.end();
});
