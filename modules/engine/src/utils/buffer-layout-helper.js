// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '@luma.gl/core';
/** BufferLayoutHelper is a helper class that should not be used directly by applications */
export class BufferLayoutHelper {
    bufferLayouts;
    constructor(bufferLayouts) {
        this.bufferLayouts = bufferLayouts;
    }
    getBufferLayout(name) {
        return this.bufferLayouts.find(layout => layout.name === name) || null;
    }
    /** Get attribute names from a BufferLayout */
    getAttributeNamesForBuffer(bufferLayout) {
        return bufferLayout.attributes
            ? bufferLayout.attributes?.map(layout => layout.attribute)
            : [bufferLayout.name];
    }
    mergeBufferLayouts(bufferLayouts1, bufferLayouts2) {
        const mergedLayouts = [...bufferLayouts1];
        for (const attribute of bufferLayouts2) {
            const index = mergedLayouts.findIndex(attribute2 => attribute2.name === attribute.name);
            if (index < 0) {
                mergedLayouts.push(attribute);
            }
            else {
                mergedLayouts[index] = attribute;
            }
        }
        return mergedLayouts;
    }
    getBufferIndex(bufferName) {
        const bufferIndex = this.bufferLayouts.findIndex(layout => layout.name === bufferName);
        if (bufferIndex === -1) {
            log.warn(`BufferLayout: Missing buffer for "${bufferName}".`)();
        }
        return bufferIndex;
    }
}
