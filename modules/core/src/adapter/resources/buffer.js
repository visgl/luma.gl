// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Abstract GPU buffer */
export class Buffer extends Resource {
    /** Index buffer */
    static INDEX = 0x0010;
    /** Vertex buffer */
    static VERTEX = 0x0020;
    /** Uniform buffer */
    static UNIFORM = 0x0040;
    /** Storage buffer */
    static STORAGE = 0x0080;
    static INDIRECT = 0x0100;
    static QUERY_RESOLVE = 0x0200;
    // Usage Flags
    static MAP_READ = 0x01;
    static MAP_WRITE = 0x02;
    static COPY_SRC = 0x0004;
    static COPY_DST = 0x0008;
    get [Symbol.toStringTag]() {
        return 'Buffer';
    }
    /** The usage with which this buffer was created */
    usage;
    /** For index buffers, whether indices are 8, 16 or 32 bit. Note: uint8 indices are automatically converted to uint16 for WebGPU compatibility */
    indexType;
    /** "Time" of last update, can be used to check if redraw is needed */
    updateTimestamp;
    constructor(device, props) {
        const deducedProps = { ...props };
        // Deduce indexType
        if ((props.usage || 0) & Buffer.INDEX && !props.indexType) {
            if (props.data instanceof Uint32Array) {
                deducedProps.indexType = 'uint32';
            }
            else if (props.data instanceof Uint16Array) {
                deducedProps.indexType = 'uint16';
            }
            else if (props.data instanceof Uint8Array) {
                deducedProps.indexType = 'uint8';
            }
        }
        // Remove data from props before storing, we don't want to hold on to a big chunk of memory
        delete deducedProps.data;
        super(device, deducedProps, Buffer.defaultProps);
        this.usage = deducedProps.usage || 0;
        this.indexType = deducedProps.indexType;
        // TODO - perhaps this should be set on async write completion?
        this.updateTimestamp = device.incrementTimestamp();
    }
    /**
     * Create a copy of this Buffer with new byteLength, with same props but of the specified size.
     * @note Does not copy contents of the cloned Buffer.
     */
    clone(props) {
        return this.device.createBuffer({ ...this.props, ...props });
    }
    // PROTECTED METHODS (INTENDED FOR USE BY OTHER FRAMEWORK CODE ONLY)
    /** Max amount of debug data saved. Two vec4's */
    static DEBUG_DATA_MAX_LENGTH = 32;
    /** A partial CPU-side copy of the data in this buffer, for debugging purposes */
    debugData = new ArrayBuffer(0);
    /** This doesn't handle partial non-zero offset updates correctly */
    _setDebugData(data, byteOffset, byteLength) {
        let arrayBufferView = null;
        let arrayBuffer;
        if (ArrayBuffer.isView(data)) {
            arrayBufferView = data;
            arrayBuffer = data.buffer;
        }
        else {
            arrayBuffer = data;
        }
        const debugDataLength = Math.min(data ? data.byteLength : byteLength, Buffer.DEBUG_DATA_MAX_LENGTH);
        if (arrayBuffer === null) {
            this.debugData = new ArrayBuffer(debugDataLength);
        }
        else {
            const sourceByteOffset = Math.min(arrayBufferView?.byteOffset || 0, arrayBuffer.byteLength);
            const availableByteLength = Math.max(0, arrayBuffer.byteLength - sourceByteOffset);
            const copyByteLength = Math.min(debugDataLength, availableByteLength);
            this.debugData = new Uint8Array(arrayBuffer, sourceByteOffset, copyByteLength).slice().buffer;
        }
    }
    static defaultProps = {
        ...Resource.defaultProps,
        usage: 0, // Buffer.COPY_DST | Buffer.COPY_SRC
        byteLength: 0,
        byteOffset: 0,
        data: null,
        indexType: 'uint16',
        onMapped: undefined
    };
}
