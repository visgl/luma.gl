import {uid} from '@luma.gl/core';
import test from 'tape-promise/tape';

test('Utils#uid', t => {
  t.ok(typeof uid() === 'string', 'Type of uid() is correct');
  t.equal(uid('prefix').indexOf('prefix'), 0, 'uid("prefix") starts with prefix');
  t.end();
});
