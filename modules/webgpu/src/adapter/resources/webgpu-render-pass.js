// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { RenderPass, log } from '@luma.gl/core';
export class WebGPURenderPass extends RenderPass {
    device;
    handle;
    /** Active pipeline */
    pipeline = null;
    constructor(device, props = {}) {
        super(device, props);
        this.device = device;
        const framebuffer = props.framebuffer || device.getCanvasContext().getCurrentFramebuffer();
        const renderPassDescriptor = this.getRenderPassDescriptor(framebuffer);
        const webgpuQuerySet = props.timestampQuerySet;
        if (webgpuQuerySet) {
            renderPassDescriptor.occlusionQuerySet = webgpuQuerySet.handle;
        }
        if (device.features.has('timestamp-query')) {
            const webgpuTSQuerySet = props.timestampQuerySet;
            renderPassDescriptor.timestampWrites = webgpuTSQuerySet
                ? {
                    querySet: webgpuTSQuerySet.handle,
                    beginningOfPassWriteIndex: props.beginTimestampIndex,
                    endOfPassWriteIndex: props.endTimestampIndex
                }
                : undefined;
        }
        if (!device.commandEncoder) {
            throw new Error('commandEncoder not available');
        }
        this.device.pushErrorScope('validation');
        this.handle =
            this.props.handle || device.commandEncoder.handle.beginRenderPass(renderPassDescriptor);
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} creation failed:\n"${error.message}"`), this)();
            this.device.debug();
        });
        this.handle.label = this.props.id;
        log.groupCollapsed(3, `new WebGPURenderPass(${this.id})`)();
        log.probe(3, JSON.stringify(renderPassDescriptor, null, 2))();
        log.groupEnd(3)();
    }
    destroy() { }
    end() {
        this.handle.end();
    }
    setPipeline(pipeline) {
        this.pipeline = pipeline;
        this.device.pushErrorScope('validation');
        this.handle.setPipeline(this.pipeline.handle);
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`${this} setPipeline failed:\n"${error.message}"`), this)();
            this.device.debug();
        });
    }
    /** Sets an array of bindings (uniform buffers, samplers, textures, ...) */
    setBindings(bindings) {
        this.pipeline?.setBindings(bindings);
        const bindGroup = this.pipeline?._getBindGroup();
        if (bindGroup) {
            this.handle.setBindGroup(0, bindGroup);
        }
    }
    setIndexBuffer(buffer, indexFormat, offset = 0, size) {
        this.handle.setIndexBuffer(buffer.handle, indexFormat, offset, size);
    }
    setVertexBuffer(slot, buffer, offset = 0) {
        this.handle.setVertexBuffer(slot, buffer.handle, offset);
    }
    draw(options) {
        if (options.indexCount) {
            this.handle.drawIndexed(options.indexCount, options.instanceCount, options.firstIndex, options.baseVertex, options.firstInstance);
        }
        else {
            this.handle.draw(options.vertexCount || 0, options.instanceCount || 1, options.firstIndex, options.firstInstance);
        }
    }
    drawIndirect() {
        // drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
        // drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    }
    setParameters(parameters) {
        const { blendConstant, stencilReference, scissorRect, viewport } = parameters;
        if (blendConstant) {
            this.handle.setBlendConstant(blendConstant);
        }
        if (stencilReference) {
            this.handle.setStencilReference(stencilReference);
        }
        if (scissorRect) {
            this.handle.setScissorRect(scissorRect[0], scissorRect[1], scissorRect[2], scissorRect[3]);
        }
        // TODO - explain how 3 dimensions vs 2 in WebGL works.
        if (viewport) {
            this.handle.setViewport(viewport[0], viewport[1], viewport[2], viewport[3], viewport[4] ?? 0, viewport[5] ?? 1);
        }
    }
    pushDebugGroup(groupLabel) {
        this.handle.pushDebugGroup(groupLabel);
    }
    popDebugGroup() {
        this.handle.popDebugGroup();
    }
    insertDebugMarker(markerLabel) {
        this.handle.insertDebugMarker(markerLabel);
    }
    beginOcclusionQuery(queryIndex) {
        this.handle.beginOcclusionQuery(queryIndex);
    }
    endOcclusionQuery() {
        this.handle.endOcclusionQuery();
    }
    // executeBundles(bundles: Iterable<GPURenderBundle>): void;
    // INTERNAL
    /**
     * Partial render pass descriptor. Used by WebGPURenderPass.
     * @returns attachments fields of a renderpass descriptor.
     */
    getRenderPassDescriptor(framebuffer) {
        const renderPassDescriptor = {
            colorAttachments: []
        };
        renderPassDescriptor.colorAttachments = framebuffer.colorAttachments.map((colorAttachment, index) => ({
            // clear values
            loadOp: this.props.clearColor !== false ? 'clear' : 'load',
            clearValue: convertColor(this.props.clearColors?.[index] || this.props.clearColor || RenderPass.defaultClearColor),
            storeOp: this.props.discard ? 'discard' : 'store',
            // ...colorAttachment,
            view: colorAttachment.handle
        }));
        if (framebuffer.depthStencilAttachment) {
            renderPassDescriptor.depthStencilAttachment = {
                view: framebuffer.depthStencilAttachment.handle
            };
            const { depthStencilAttachment } = renderPassDescriptor;
            // DEPTH
            if (this.props.depthReadOnly) {
                depthStencilAttachment.depthReadOnly = true;
            }
            if (this.props.clearDepth !== false) {
                depthStencilAttachment.depthClearValue = this.props.clearDepth;
            }
            // STENCIL
            // if (this.props.clearStencil !== false) {
            //   depthStencilAttachment.stencilClearValue = this.props.clearStencil;
            // }
            // WebGPU only wants us to set these parameters if the texture format actually has a depth aspect
            const hasDepthAspect = true;
            if (hasDepthAspect) {
                depthStencilAttachment.depthLoadOp = this.props.clearDepth !== false ? 'clear' : 'load';
                depthStencilAttachment.depthStoreOp = 'store'; // TODO - support 'discard'?
            }
            // WebGPU only wants us to set these parameters if the texture format actually has a stencil aspect
            const hasStencilAspect = false;
            if (hasStencilAspect) {
                depthStencilAttachment.stencilLoadOp = this.props.clearStencil !== false ? 'clear' : 'load';
                depthStencilAttachment.stencilStoreOp = 'store'; // TODO - support 'discard'?
            }
        }
        return renderPassDescriptor;
    }
}
function convertColor(color) {
    return { r: color[0], g: color[1], b: color[2], a: color[3] };
}
