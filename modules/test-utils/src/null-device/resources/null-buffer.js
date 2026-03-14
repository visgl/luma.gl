// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Buffer } from '@luma.gl/core';
export class NullBuffer extends Buffer {
    device;
    handle = 'null';
    byteLength;
    _storage;
    constructor(device, props = {}) {
        super(device, props);
        this.device = device;
        const byteOffset = props.byteOffset || 0;
        const byteLength = props.byteLength ?? (props.data ? props.data.byteLength + byteOffset : 0);
        this.byteLength = byteLength;
        this._storage = new ArrayBuffer(byteLength);
        // If initial data is provided, copy it in
        if (props.data) {
            this.write(props.data, byteOffset);
        }
        this.trackAllocatedMemory(byteLength);
    }
    destroy() {
        if (!this.destroyed) {
            super.destroy();
            this.trackDeallocatedMemory();
            // @ts-expect-error
            this.handle = null;
            // Clear internal storage
            this._storage = new ArrayBuffer(0);
        }
    }
    write(data, byteOffset = 0) {
        const source = ArrayBuffer.isView(data)
            ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
            : new Uint8Array(data);
        const target = new Uint8Array(this._storage, byteOffset, source.byteLength);
        if (byteOffset + source.byteLength > this.byteLength) {
            throw new RangeError(`NullBuffer.write(): write would overflow buffer`);
        }
        target.set(source);
        this._setDebugData(data, byteOffset, source.byteLength);
    }
    async mapAndWriteAsync(callback, byteOffset = 0, byteLength = this.byteLength - byteOffset) {
        const view = new Uint8Array(this._storage, byteOffset, byteLength);
        const tempBuffer = new Uint8Array(view.length); // safe scratch copy
        callback(tempBuffer.buffer, 'copied');
        view.set(tempBuffer);
        this._setDebugData(view, byteOffset, byteLength);
    }
    async readAsync(byteOffset = 0, byteLength) {
        byteLength = byteLength ?? this.byteLength - byteOffset;
        if (byteOffset + byteLength > this.byteLength) {
            throw new RangeError(`NullBuffer.readAsync(): read would overflow buffer`);
        }
        const view = new Uint8Array(this._storage, byteOffset, byteLength);
        return new Uint8Array(view); // return a copy
    }
    async mapAndReadAsync(callback, byteOffset = 0, byteLength = this.byteLength - byteOffset) {
        const view = new Uint8Array(this._storage, byteOffset, byteLength);
        const copy = new Uint8Array(view); // copy to protect memory
        return callback(copy.buffer, 'copied');
    }
    readSyncWebGL() {
        throw new Error('NullBuffer.readSyncWebGL() not implemented');
    }
}
