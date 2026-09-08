// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {capitalize} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

export function registerCapitalizeTests(): void {
  it('shadertools#capitalize', () => {
    expect(capitalize('hello world'), 'should capitalize string').toBe('Hello world');
    expect(capitalize('Hello world'), 'should return already capitalized string').toBe(
      'Hello world'
    );
    expect(capitalize('1'), 'should ignore non-alphabetic string').toBe('1');
    expect(capitalize(''), 'should preserve empty strings').toBe('');
  });
}
