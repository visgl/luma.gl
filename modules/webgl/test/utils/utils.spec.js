import {uid, isPowerOfTwo} from '@luma.gl/webgl/utils';
import test from 'tape-catch';

test('Utils#uid', t => {
  t.ok(typeof uid() === 'string', 'Type of uid() is correct');
  t.equal(uid('prefix').indexOf('prefix'), 0, 'uid("prefix") starts with prefix');
  t.end();
});

test('Utils#isPowerOfTwo', t => {
  t.ok(JSON.stringify(isPowerOfTwo(1)) === JSON.stringify(true));
  t.ok(JSON.stringify(isPowerOfTwo(2)) === JSON.stringify(true));
  t.ok(JSON.stringify(isPowerOfTwo(3)) === JSON.stringify(false));
  t.ok(JSON.stringify(isPowerOfTwo(500)) === JSON.stringify(false));
  t.ok(JSON.stringify(isPowerOfTwo(512)) === JSON.stringify(true));
  t.ok(JSON.stringify(isPowerOfTwo(514)) === JSON.stringify(false));
  t.end();
});
