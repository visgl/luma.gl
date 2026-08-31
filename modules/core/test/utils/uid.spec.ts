import {uid} from '@luma.gl/core/utils/uid';
import {expect, it} from 'vitest';

it('Utils#uid', () => {
  expect(Boolean(typeof uid() === 'string'), 'Type of uid() is correct').toBe(true);
  expect(uid('prefix').indexOf('prefix'), 'uid("prefix") starts with prefix').toBe(0);
  void 0;
});
