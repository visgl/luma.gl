import {expect, test} from 'vitest';
import { uid } from '@luma.gl/core/utils/uid';
test('Utils#uid', () => {
  expect(typeof uid() === 'string', 'Type of uid() is correct').toBeTruthy();
  expect(uid('prefix').indexOf('prefix'), 'uid("prefix") starts with prefix').toBe(0);
});
