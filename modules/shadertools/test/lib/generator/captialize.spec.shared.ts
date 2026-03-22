import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { capitalize } from '@luma.gl/shadertools';
export function registerCapitalizeTests(): void {
  test('shadertools#capitalize', () => {
    expect(capitalize('hello world'), 'should capitalize string').toBe('Hello world');
    expect(capitalize('Hello world'), 'should return already capitalized string').toBe('Hello world');
    expect(capitalize('1'), 'should ignore non-alphabetic string').toBe('1');
    expect(capitalize(''), 'should preserve empty strings').toBe('');
  });
}
