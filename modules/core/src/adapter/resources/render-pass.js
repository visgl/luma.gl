// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// import {Binding} from '../types/shader-layout';
import { Resource } from './resource';
/**
 * A RenderPass instance is a required parameter to all draw calls.
 *
 * It holds a combination of
 * - render targets (specified via a framebuffer)
 * - clear colors, read/write, discard information for the framebuffer attachments
 * - a couple of mutable parameters ()
 */
export class RenderPass extends Resource {
    /** TODO - should be [0, 0, 0, 0], update once deck.gl tests run clean */
    static defaultClearColor = [0, 0, 0, 1];
    /** Depth 1.0 represents the far plance */
    static defaultClearDepth = 1;
    /** Clears all stencil bits */
    static defaultClearStencil = 0;
    get [Symbol.toStringTag]() {
        return 'RenderPass';
    }
    constructor(device, props) {
        props = RenderPass.normalizeProps(device, props);
        super(device, props, RenderPass.defaultProps);
    }
    static normalizeProps(device, props) {
        return props;
    }
    /** Default properties for RenderPass */
    static defaultProps = {
        ...Resource.defaultProps,
        framebuffer: null,
        parameters: undefined,
        clearColor: RenderPass.defaultClearColor,
        clearColors: undefined,
        clearDepth: RenderPass.defaultClearDepth,
        clearStencil: RenderPass.defaultClearStencil,
        depthReadOnly: false,
        stencilReadOnly: false,
        discard: false,
        occlusionQuerySet: undefined,
        timestampQuerySet: undefined,
        beginTimestampIndex: undefined,
        endTimestampIndex: undefined
    };
}
// TODO - Can we align WebGL implementation with WebGPU API?
// In WebGPU the following methods are on the renderpass instead of the renderpipeline
// luma.gl keeps them on the pipeline for now, but that has some issues.
// abstract setPipeline(pipeline: RenderPipeline): void {}
// abstract setIndexBuffer()
// abstract setVertexBuffer(slot: number, buffer: Buffer, offset: number): void;
// abstract setBindings(bindings: Record<string, Binding>): void;
// abstract setParameters(parameters: RenderPassParameters);
// abstract draw(options: {
// abstract drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
// abstract drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
