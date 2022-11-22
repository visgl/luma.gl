// luma.gl, MIT license

import {assert} from '@luma.gl/api';

// Resolve a WebGL enumeration name (returns itself if already a number)
export function getKeyValue(gl: WebGLRenderingContext, name: string | number): number   {
  // If not a string, return (assume number)
  if (typeof name !== 'string') {
    return name;
  }

  // If string converts to number, return number
  const number = Number(name);
  if (!isNaN(number)) {
    return number;
  }

  // Look up string, after removing any 'GL.' or 'gl.' prefix
  name = name.replace(/^.*\./, '');
  // @ts-ignore-error
  const value = gl[name];
  assert(value !== undefined, `Accessing undefined constant GL.${name}`);
  return value;
}

export function getKey(gl: WebGLRenderingContext, value: number | string): string {
  // @ts-ignore-error
  gl = gl.gl || gl;
  value = Number(value);
  for (const key in gl) {
    // @ts-ignore-error
    if (gl[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}

export function getKeyType(gl: WebGLRenderingContext, value: any): string {
  assert(value !== undefined, 'undefined key');
  value = Number(value);
  for (const key in gl) {
    // @ts-ignore-error
    if (gl[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}
