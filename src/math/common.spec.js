import {isArray} from './index';
// import {tapeEquals} from './index';
import test from 'tape-catch';

test('Math#types', t => {
  t.equals(typeof isArray, 'function');
  t.end();
});

test('Math#construct and isArray check', t => {
  t.ok(isArray([]));
  t.ok(isArray(new Float32Array()));
  t.fail(isArray(new ArrayBuffer()));
  t.fail(isArray(new DataView(new ArrayBuffer())));

  t.fail(isArray(undefined));
  t.fail(isArray(null));
  t.fail(isArray({}));
  t.fail(isArray({length: 0}));
  t.fail(isArray(1));
  t.fail(isArray(NaN));
  t.fail(isArray('NaN'));
  t.fail(isArray(''));

  t.end();
});
