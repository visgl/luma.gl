// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Buffer } from '@luma.gl/core';
import { getPassthroughFS } from '@luma.gl/shadertools';
import { Model } from '../model/model';
/**
 * Manages a WebGL program (pipeline) for buffer→buffer transforms.
 * @note Only works under WebGL2.
 */
export class BufferTransform {
    device;
    model;
    transformFeedback;
    static defaultProps = {
        ...Model.defaultProps,
        outputs: undefined,
        feedbackBuffers: undefined
    };
    static isSupported(device) {
        return device?.info?.type === 'webgl';
    }
    constructor(device, props = BufferTransform.defaultProps) {
        if (!BufferTransform.isSupported(device)) {
            throw new Error('BufferTransform not yet implemented on WebGPU');
        }
        this.device = device;
        this.model = new Model(this.device, {
            id: props.id || 'buffer-transform-model',
            fs: props.fs || getPassthroughFS(),
            topology: props.topology || 'point-list',
            varyings: props.outputs || props.varyings,
            ...props
        });
        this.transformFeedback = this.device.createTransformFeedback({
            layout: this.model.pipeline.shaderLayout,
            // @ts-expect-error TODO
            buffers: props.feedbackBuffers
        });
        this.model.setTransformFeedback(this.transformFeedback);
        Object.seal(this);
    }
    /** Destroy owned resources. */
    destroy() {
        if (this.model) {
            this.model.destroy();
        }
    }
    /** @deprecated Use {@link destroy}. */
    delete() {
        this.destroy();
    }
    /** Run one transform loop. */
    run(options) {
        if (options?.inputBuffers) {
            this.model.setAttributes(options.inputBuffers);
        }
        if (options?.outputBuffers) {
            this.transformFeedback.setBuffers(options.outputBuffers);
        }
        const renderPass = this.device.beginRenderPass(options);
        this.model.draw(renderPass);
        renderPass.end();
    }
    // DEPRECATED METHODS
    /** @deprecated App knows what buffers it is passing in - Returns the {@link Buffer} or {@link BufferRange} for given varying name. */
    getBuffer(varyingName) {
        return this.transformFeedback.getBuffer(varyingName);
    }
    /** @deprecated App knows what buffers it is passing in - Reads the {@link Buffer} or {@link BufferRange} for given varying name. */
    readAsync(varyingName) {
        const result = this.getBuffer(varyingName);
        if (!result) {
            throw new Error('BufferTransform#getBuffer');
        }
        if (result instanceof Buffer) {
            return result.readAsync();
        }
        const { buffer, byteOffset = 0, byteLength = buffer.byteLength } = result;
        return buffer.readAsync(byteOffset, byteLength);
    }
}
