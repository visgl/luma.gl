// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GLKeyByValue = Map<number, string>;

/**
 * Returns the GL.<KEY> constant that corresponds to a numeric value.
 * Duplicate values include every matching constant in declaration order.
 */
export function getGLKey(
  value: unknown,
  keyByValue: GLKeyByValue,
  options?: {emptyIfUnknown?: boolean}
): string {
  const key = keyByValue.get(Number(value));
  if (key) {
    return key;
  }
  return options?.emptyIfUnknown ? '' : String(value);
}

/** Returns a map with GL.<KEY> constants mapped to strings, for both keys and values. */
export function getGLKeys(
  glParameters: Record<number, unknown>,
  keyByValue: GLKeyByValue
): Record<string, string> {
  const options = {emptyIfUnknown: true};
  return Object.entries(glParameters).reduce<Record<string, string>>((keys, [key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    keys[`${key}:${getGLKey(key, keyByValue, options)}`] =
      `${value}:${getGLKey(value, keyByValue, options)}`;
    return keys;
  }, {});
}

/** Build a reverse lookup from the stable uppercase constant properties of a WebGL context. */
export function createGLKeyByValue(gl: object): GLKeyByValue {
  const keyByValue = new Map<number, string>();
  for (const key in gl) {
    const value = (gl as Record<string, unknown>)[key];
    // WebGL constants are ASCII uppercase names; this excludes mutable camelCase context properties.
    if (key < 'a' && typeof value === 'number') {
      const previousKeys = keyByValue.get(value);
      keyByValue.set(value, previousKeys ? `${previousKeys}, GL.${key}` : `GL.${key}`);
    }
  }
  return keyByValue;
}
