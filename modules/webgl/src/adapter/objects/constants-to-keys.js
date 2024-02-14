// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { assert } from '@luma.gl/core';
// Resolve a WebGL enumeration name (returns itself if already a number)
export function getKeyValue(gl, name) {
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
    // @ts-ignore expect-error depends on settings
    const value = gl[name];
    assert(value !== undefined, `Accessing undefined constant GL.${name}`);
    return value;
}
