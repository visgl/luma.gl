import {merge, splat, noop, uid, isPowerOfTwo} from '../../src/utils';
import test from 'tape-catch';

test('Utils#merge', t => {
  const a = {e: 1};
  let b = merge({}, a);
  t.ok(JSON.stringify(b) === JSON.stringify({e: 1}));
  b = merge(b, a);
  t.ok(JSON.stringify(b) === JSON.stringify({e: 1}));
  b = merge({f: 2}, a);
  t.ok(JSON.stringify(b) === JSON.stringify({f: 2, e: 1}));
  t.end();
});

test('Utils#splat', t => {
  t.ok(JSON.stringify(splat(1)) === JSON.stringify([1]));
  t.ok(JSON.stringify(splat([1])) === JSON.stringify([1]));
  t.end();
});

test('Utils#noop', t => {
  t.ok(noop.toString() === 'function noop() {}');
  t.ok(noop() === undefined);
  t.end();
});

test('Utils#uid', t => {
  t.ok(typeof uid() === 'string', 'Type of uid() is correct');
  t.equal(uid('prefix').indexOf('prefix'), 0,
    'uid("prefix") starts with prefix');
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
