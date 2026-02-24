// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Throws if condition is true and narrows type */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'luma.gl assertion failed.');
  }
}

/** Throws if value is not defined, narrows type */
export function assertDefined<T>(value: T | undefined, message?: string): T {
  assert(value, message);
  return value;
}
