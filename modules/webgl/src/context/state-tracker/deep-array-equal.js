// luma.gl, MIT license
// Copyright (c) vis.gl contributors
/** deeply compare two arrays */
export function deepArrayEqual(x, y) {
    if (x === y) {
        return true;
    }
    const isArrayX = Array.isArray(x) || ArrayBuffer.isView(x);
    const isArrayY = Array.isArray(y) || ArrayBuffer.isView(y);
    // @ts-expect-error TODO fix
    if (isArrayX && isArrayY && x.length === y.length) {
        // @ts-expect-error TODO fix
        for (let i = 0; i < x.length; ++i) {
            if (x[i] !== y[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}
