// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { VertexArray, log } from '@luma.gl/core';
import { getBrowser } from '@probe.gl/env';
/** VertexArrayObject wrapper */
export class WebGPUVertexArray extends VertexArray {
    get [Symbol.toStringTag]() {
        return 'WebGPUVertexArray';
    }
    device;
    /** Vertex Array is just a helper class under WebGPU */
    handle = null;
    // Create a VertexArray
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    destroy() { }
    /**
     * Set an elements buffer, for indexed rendering.
     * Must be a Buffer bound to buffer with usage bit Buffer.INDEX set.
     */
    setIndexBuffer(buffer) {
        // assert(!elementBuffer || elementBuffer.glTarget === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);
        this.indexBuffer = buffer;
    }
    /** Set a bufferSlot in vertex attributes array to a buffer, enables the bufferSlot, sets divisor */
    setBuffer(bufferSlot, buffer) {
        // Sanity check target
        // if (buffer.glUsage === GL.ELEMENT_ARRAY_BUFFER) {
        //   throw new Error('Use setIndexBuffer');
        // }
        this.attributes[bufferSlot] = buffer;
    }
    bindBeforeRender(renderPass, firstIndex, indexCount) {
        const webgpuRenderPass = renderPass;
        const webgpuIndexBuffer = this.indexBuffer;
        if (webgpuIndexBuffer?.handle) {
            // Note we can't unset an index buffer
            log.info(3, 'setting index buffer', webgpuIndexBuffer?.handle, webgpuIndexBuffer?.indexType)();
            webgpuRenderPass.handle.setIndexBuffer(webgpuIndexBuffer?.handle, 
            // @ts-expect-error TODO - we must enforce type
            webgpuIndexBuffer?.indexType);
        }
        for (let location = 0; location < this.maxVertexAttributes; location++) {
            const webgpuBuffer = this.attributes[location];
            if (webgpuBuffer?.handle) {
                log.info(3, `setting vertex buffer ${location}`, webgpuBuffer?.handle)();
                webgpuRenderPass.handle.setVertexBuffer(location, webgpuBuffer?.handle);
            }
        }
        // TODO - emit warnings/errors/throw if constants have been set on this vertex array
    }
    unbindAfterRender(renderPass) {
        // On WebGPU we don't need to unbind.
        // In fact we can't easily do it. setIndexBuffer/setVertexBuffer don't accept null.
        // Unbinding presumably happens automatically when the render pass is ended.
    }
    // DEPRECATED METHODS
    /**
     * @deprecated is this even an issue for WebGPU?
     * Attribute 0 can not be disable on most desktop OpenGL based browsers
     */
    static isConstantAttributeZeroSupported(device) {
        return getBrowser() === 'Chrome';
    }
}
