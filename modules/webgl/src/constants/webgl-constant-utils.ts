// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GLKeyByValue = Map<number, string>;

/** Build a reverse lookup from the stable uppercase constant properties of a WebGL context. */
export function createGLKeyByValue(gl: object): GLKeyByValue {
  const keyByValue = new Map<number, string>();
  for (const key in gl) {
    const value = (gl as Record<string, number>)[key];
    // WebGL constants are ASCII uppercase names; this excludes mutable camelCase context properties.
    if (key < 'a') {
      const previousKeys = keyByValue.get(value);
      keyByValue.set(value, previousKeys ? `${previousKeys}, GL.${key}` : `GL.${key}`);
    }
  }
  return keyByValue;
}
