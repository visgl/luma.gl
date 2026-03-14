// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { VertexArray } from '@luma.gl/core';
export class NullVertexArray extends VertexArray {
    device;
    handle = null;
    // Create a VertexArray
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    setIndexBuffer(indexBuffer) {
        this.indexBuffer = indexBuffer;
    }
    /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
    setBuffer(location, attributeBuffer) {
        const attributeInfo = this.attributeInfos[location];
        if (!attributeInfo) {
            throw new Error(`Unknown attribute location ${location}`);
        }
        this.attributes[location] = attributeBuffer;
    }
    bindBeforeRender() { }
    unbindAfterRender() { }
    setConstantWebGL(location, value) { }
}
