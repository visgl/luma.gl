// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
let arrayBuffer;
export function getScratchArrayBuffer(byteLength) {
    if (!arrayBuffer || arrayBuffer.byteLength < byteLength) {
        arrayBuffer = new ArrayBuffer(byteLength);
    }
    return arrayBuffer;
}
export function getScratchArray(Type, length) {
    const scratchArrayBuffer = getScratchArrayBuffer(Type.BYTES_PER_ELEMENT * length);
    return new Type(scratchArrayBuffer, 0, length); // arrayBuffer, byteOffset, length (in elements)
}
