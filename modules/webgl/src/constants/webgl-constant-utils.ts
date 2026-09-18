// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GL} from './webgl-constants';

const GL_KEY_BY_VALUE = createGLKeyByValue();

/**
 * Returns the GL.<KEY> constant that corresponds to a numeric value.
 * Duplicate values include every matching constant in declaration order.
 */
export function getGLKey(value: unknown, options?: {emptyIfUnknown?: boolean}): string {
  const key = GL_KEY_BY_VALUE.get(Number(value));
  if (key) {
    return key.join(', ');
  }
  return options?.emptyIfUnknown ? '' : String(value);
}

/** Returns a map with GL.<KEY> constants mapped to strings, for both keys and values. */
export function getGLKeys(glParameters: Record<number, unknown>): Record<string, string> {
  const options = {emptyIfUnknown: true};
  return Object.entries(glParameters).reduce<Record<string, string>>((keys, [key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    keys[`${key}:${getGLKey(key, options)}`] = `${value}:${getGLKey(value, options)}`;
    return keys;
  }, {});
}

function createGLKeyByValue(): Map<number, string[]> {
  const keyByValue = new Map<number, string[]>();
  for (const key of Object.keys(GL)) {
    const value = GL[key as keyof typeof GL];
    if (typeof value === 'number') {
      const keys = keyByValue.get(value) || [];
      keys.push(`GL.${key}`);
      keyByValue.set(value, keys);
    }
  }
  return keyByValue;
}
