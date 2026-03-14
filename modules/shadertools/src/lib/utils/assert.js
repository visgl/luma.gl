// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Recommendation is to ignore message but current test suite checks agains the
// message so keep it for now.
export function assert(condition, message) {
    if (!condition) {
        const error = new Error(message || 'shadertools: assertion failed.');
        Error.captureStackTrace?.(error, assert);
        throw error;
    }
}
