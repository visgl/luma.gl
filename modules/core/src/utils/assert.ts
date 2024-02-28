// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Recommendation is to ignore message but current test suite checks agains the
// message so keep it for now.
export function assert(condition: unknown, message?: string): void | never {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}
