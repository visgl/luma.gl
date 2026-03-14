// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Throws if condition is true and narrows type */
export function assert(condition, message) {
    if (!condition) {
        const error = new Error(message ?? 'luma.gl assertion failed.');
        Error.captureStackTrace?.(error, assert);
        throw error;
    }
}
/** Throws if value is not defined, narrows type */
export function assertDefined(value, message) {
    assert(value, message);
    return value;
}
