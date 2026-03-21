import {uid} from '@luma.gl/core/utils/uid';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('Utils#uid', t => {
  t.ok(typeof uid() === 'string', 'Type of uid() is correct');
  t.equal(uid('prefix').indexOf('prefix'), 0, 'uid("prefix") starts with prefix');
  t.end();
});
