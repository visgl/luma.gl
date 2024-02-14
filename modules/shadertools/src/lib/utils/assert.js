// luma.gl, MIT license
// Copyright (c) vis.gl contributors
// Recommendation is to ignore message but current test suite checks agains the
// message so keep it for now.
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'shadertools: assertion failed.');
    }
}
