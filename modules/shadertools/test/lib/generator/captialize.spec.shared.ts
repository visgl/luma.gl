// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {capitalize} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerCapitalizeTests(test: TapeTestFunction): void {
  test('shadertools#capitalize', t => {
    t.equal(capitalize('hello world'), 'Hello world', 'should capitalize string');
    t.equal(capitalize('Hello world'), 'Hello world', 'should return already capitalized string');
    t.equal(capitalize('1'), '1', 'should ignore non-alphabetic string');
    t.equal(capitalize(''), '', 'should preserve empty strings');
    t.end();
  });
}
