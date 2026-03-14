// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { PresentationContext } from '@luma.gl/core';
/**
 * Tracks a non-WebGL destination canvas while rendering into the device's default canvas context.
 */
export class WebGLPresentationContext extends PresentationContext {
    device;
    handle = null;
    context2d;
    get [Symbol.toStringTag]() {
        return 'WebGLPresentationContext';
    }
    constructor(device, props = {}) {
        super(props);
        this.device = device;
        const contextLabel = `${this[Symbol.toStringTag]}(${this.id})`;
        const defaultCanvasContext = this.device.getDefaultCanvasContext();
        if (!defaultCanvasContext.offscreenCanvas) {
            throw new Error(`${contextLabel}: WebGL PresentationContext requires the default CanvasContext canvas to be an OffscreenCanvas`);
        }
        const context2d = this.canvas.getContext('2d');
        if (!context2d) {
            throw new Error(`${contextLabel}: Failed to create 2d presentation context`);
        }
        this.context2d = context2d;
        this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`);
        this._configureDevice();
    }
    present() {
        this._resizeDrawingBufferIfNeeded();
        this.device.submit();
        const defaultCanvasContext = this.device.getDefaultCanvasContext();
        const [sourceWidth, sourceHeight] = defaultCanvasContext.getDrawingBufferSize();
        if (sourceWidth !== this.drawingBufferWidth ||
            sourceHeight !== this.drawingBufferHeight ||
            defaultCanvasContext.canvas.width !== this.drawingBufferWidth ||
            defaultCanvasContext.canvas.height !== this.drawingBufferHeight) {
            throw new Error(`${this[Symbol.toStringTag]}(${this.id}): Default canvas context size ${sourceWidth}x${sourceHeight} does not match presentation size ${this.drawingBufferWidth}x${this.drawingBufferHeight}`);
        }
        this.context2d.clearRect(0, 0, this.drawingBufferWidth, this.drawingBufferHeight);
        this.context2d.drawImage(defaultCanvasContext.canvas, 0, 0);
    }
    _configureDevice() { }
    _getCurrentFramebuffer(options) {
        const defaultCanvasContext = this.device.getDefaultCanvasContext();
        defaultCanvasContext.setDrawingBufferSize(this.drawingBufferWidth, this.drawingBufferHeight);
        return defaultCanvasContext.getCurrentFramebuffer(options);
    }
}
