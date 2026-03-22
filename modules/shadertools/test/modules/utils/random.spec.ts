import {expect, test} from 'vitest';
import { random } from '@luma.gl/shadertools';
test('random#build', () => {
  expect(random.fs, 'random module fs is ok').toBeTruthy();
});
