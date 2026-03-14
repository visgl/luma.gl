// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CanvasContext, Texture, log } from '@luma.gl/core';
import { WebGPUFramebuffer } from './resources/webgpu-framebuffer';
/**
 * Holds a WebGPU Canvas Context
 * The primary job of the CanvasContext is to generate textures for rendering into the current canvas
 * It also manages canvas sizing calculations and resizing.
 */
export class WebGPUCanvasContext extends CanvasContext {
    device;
    handle;
    depthStencilAttachment = null;
    get [Symbol.toStringTag]() {
        return 'WebGPUCanvasContext';
    }
    constructor(device, adapter, props) {
        super(props);
        const context = this.canvas.getContext('webgpu');
        if (!context) {
            throw new Error(`${this}: Failed to create WebGPU canvas context`);
        }
        this.device = device;
        this.handle = context;
        // Base class constructor cannot access derived methods/fields, so we need to call these functions in the subclass constructor
        this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
        this._configureDevice();
    }
    /** Destroy any textures produced while configured and remove the context configuration. */
    destroy() {
        if (this.depthStencilAttachment) {
            this.depthStencilAttachment.destroy();
            this.depthStencilAttachment = null;
        }
        this.handle.unconfigure();
        super.destroy();
    }
    // IMPLEMENTATION OF ABSTRACT METHODS
    /** @see https://www.w3.org/TR/webgpu/#canvas-configuration */
    _configureDevice() {
        if (this.depthStencilAttachment) {
            this.depthStencilAttachment.destroy();
            this.depthStencilAttachment = null;
        }
        // Reconfigure the canvas size.
        this.handle.configure({
            device: this.device.handle,
            format: this.device.preferredColorFormat,
            // Can be used to define e.g. -srgb views
            // viewFormats: [...]
            colorSpace: this.props.colorSpace,
            alphaMode: this.props.alphaMode
        });
    }
    /** Update framebuffer with properly resized "swap chain" texture views */
    _getCurrentFramebuffer(options = {
        depthStencilFormat: 'depth24plus'
    }) {
        // Wrap the current canvas context texture in a luma.gl texture
        const currentColorAttachment = this._getCurrentTexture();
        // TODO - temporary debug code
        if (currentColorAttachment.width !== this.drawingBufferWidth ||
            currentColorAttachment.height !== this.drawingBufferHeight) {
            const [oldWidth, oldHeight] = this.getDrawingBufferSize();
            this.drawingBufferWidth = currentColorAttachment.width;
            this.drawingBufferHeight = currentColorAttachment.height;
            log.log(1, `${this}: Resized to compensate for initial canvas size mismatch ${oldWidth}x${oldHeight} => ${this.drawingBufferWidth}x${this.drawingBufferHeight}px`)();
        }
        // Resize the depth stencil attachment
        if (options?.depthStencilFormat) {
            this._createDepthStencilAttachment(options?.depthStencilFormat);
        }
        return new WebGPUFramebuffer(this.device, {
            colorAttachments: [currentColorAttachment],
            depthStencilAttachment: this.depthStencilAttachment
        });
    }
    // PRIMARY METHODS
    /** Wrap the current canvas context texture in a luma.gl texture */
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
    /** We build render targets on demand (i.e. not when size changes but when about to render) */
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
