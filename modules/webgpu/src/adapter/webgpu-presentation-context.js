// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { PresentationContext, Texture, log } from '@luma.gl/core';
import { WebGPUFramebuffer } from './resources/webgpu-framebuffer';
/**
 * A WebGPU PresentationContext renders directly into its destination canvas.
 */
export class WebGPUPresentationContext extends PresentationContext {
    device;
    handle;
    depthStencilAttachment = null;
    get [Symbol.toStringTag]() {
        return 'WebGPUPresentationContext';
    }
    constructor(device, props = {}) {
        super(props);
        const contextLabel = `${this[Symbol.toStringTag]}(${this.id})`;
        const context = this.canvas.getContext('webgpu');
        if (!context) {
            throw new Error(`${contextLabel}: Failed to create WebGPU presentation context`);
        }
        this.device = device;
        this.handle = context;
        this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`);
        this._configureDevice();
    }
    destroy() {
        if (this.depthStencilAttachment) {
            this.depthStencilAttachment.destroy();
            this.depthStencilAttachment = null;
        }
        this.handle.unconfigure();
        super.destroy();
    }
    present() {
        this.device.submit();
    }
    _configureDevice() {
        if (this.depthStencilAttachment) {
            this.depthStencilAttachment.destroy();
            this.depthStencilAttachment = null;
        }
        this.handle.configure({
            device: this.device.handle,
            format: this.device.preferredColorFormat,
            colorSpace: this.props.colorSpace,
            alphaMode: this.props.alphaMode
        });
    }
    _getCurrentFramebuffer(options = {
        depthStencilFormat: 'depth24plus'
    }) {
        const currentColorAttachment = this._getCurrentTexture();
        if (currentColorAttachment.width !== this.drawingBufferWidth ||
            currentColorAttachment.height !== this.drawingBufferHeight) {
            const [oldWidth, oldHeight] = this.getDrawingBufferSize();
            this.drawingBufferWidth = currentColorAttachment.width;
            this.drawingBufferHeight = currentColorAttachment.height;
            log.log(1, `${this[Symbol.toStringTag]}(${this.id}): Resized to compensate for initial canvas size mismatch ${oldWidth}x${oldHeight} => ${this.drawingBufferWidth}x${this.drawingBufferHeight}px`)();
        }
        if (options?.depthStencilFormat) {
            this._createDepthStencilAttachment(options.depthStencilFormat);
        }
        return new WebGPUFramebuffer(this.device, {
            colorAttachments: [currentColorAttachment],
            depthStencilAttachment: this.depthStencilAttachment
        });
    }
    _getCurrentTexture() {
        const handle = this.handle.getCurrentTexture();
        return this.device.createTexture({
            id: `${this.id}#color-texture`,
            handle,
            format: this.device.preferredColorFormat,
            width: handle.width,
            height: handle.height
        });
    }
    _createDepthStencilAttachment(depthStencilFormat) {
        if (!this.depthStencilAttachment) {
            this.depthStencilAttachment = this.device.createTexture({
                id: `${this.id}#depth-stencil-texture`,
                usage: Texture.RENDER_ATTACHMENT,
                format: depthStencilFormat,
                width: this.drawingBufferWidth,
                height: this.drawingBufferHeight
            });
        }
        return this.depthStencilAttachment;
    }
}
