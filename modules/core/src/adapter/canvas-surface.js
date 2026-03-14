// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { isBrowser } from '@probe.gl/env';
import { uid } from '../utils/uid';
import { withResolvers } from '../utils/promise-utils';
import { assertDefined } from '../utils/assert';
/**
 * Shared tracked-canvas lifecycle used by both renderable and presentation contexts.
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit() @see https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export class CanvasSurface {
    static isHTMLCanvas(canvas) {
        return typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement;
    }
    static isOffscreenCanvas(canvas) {
        return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
    }
    static defaultProps = {
        id: undefined,
        canvas: null,
        width: 800,
        height: 600,
        useDevicePixels: true,
        autoResize: true,
        container: null,
        visible: true,
        alphaMode: 'opaque',
        colorSpace: 'srgb',
        trackPosition: false
    };
    id;
    props;
    canvas;
    /** Handle to HTML canvas */
    htmlCanvas;
    /** Handle to wrapped OffScreenCanvas */
    offscreenCanvas;
    type;
    /** Promise that resolved once the resize observer has updated the pixel size */
    initialized;
    isInitialized = false;
    /** Visibility is automatically updated (via an IntersectionObserver) */
    isVisible = true;
    /** Width of canvas in CSS units (tracked by a ResizeObserver) */
    cssWidth;
    /** Height of canvas in CSS units (tracked by a ResizeObserver) */
    cssHeight;
    /** Device pixel ratio. Automatically updated via media queries */
    devicePixelRatio;
    /** Exact width of canvas in physical pixels (tracked by a ResizeObserver) */
    devicePixelWidth;
    /** Exact height of canvas in physical pixels (tracked by a ResizeObserver) */
    devicePixelHeight;
    /** Width of drawing buffer: automatically tracks this.pixelWidth if props.autoResize is true */
    drawingBufferWidth;
    /** Height of drawing buffer: automatically tracks this.pixelHeight if props.autoResize is true */
    drawingBufferHeight;
    /** Resolves when the canvas is initialized, i.e. when the ResizeObserver has updated the pixel size */
    _initializedResolvers = withResolvers();
    /** ResizeObserver to track canvas size changes */
    _resizeObserver;
    /** IntersectionObserver to track canvas visibility changes */
    _intersectionObserver;
    _observeDevicePixelRatioTimeout = null;
    /** Position of the canvas in the document, updated by a timer */
    _position = [0, 0];
    /** Whether this canvas context has been destroyed */
    destroyed = false;
    /** Whether the drawing buffer size needs to be resized (deferred resizing to avoid flicker) */
    _needsDrawingBufferResize = true;
    toString() {
        return `${this[Symbol.toStringTag]}(${this.id})`;
    }
    constructor(props) {
        this.props = { ...CanvasSurface.defaultProps, ...props };
        props = this.props;
        this.initialized = this._initializedResolvers.promise;
        if (!isBrowser()) {
            this.canvas = { width: props.width || 1, height: props.height || 1 };
        }
        else if (!props.canvas) {
            this.canvas = createCanvasElement(props);
        }
        else if (typeof props.canvas === 'string') {
            this.canvas = getCanvasFromDOM(props.canvas);
        }
        else {
            this.canvas = props.canvas;
        }
        if (CanvasSurface.isHTMLCanvas(this.canvas)) {
            this.id = props.id || this.canvas.id;
            this.type = 'html-canvas';
            this.htmlCanvas = this.canvas;
        }
        else if (CanvasSurface.isOffscreenCanvas(this.canvas)) {
            this.id = props.id || 'offscreen-canvas';
            this.type = 'offscreen-canvas';
            this.offscreenCanvas = this.canvas;
        }
        else {
            this.id = props.id || 'node-canvas-context';
            this.type = 'node';
        }
        this.cssWidth = this.htmlCanvas?.clientWidth || this.canvas.width;
        this.cssHeight = this.htmlCanvas?.clientHeight || this.canvas.height;
        this.devicePixelWidth = this.canvas.width;
        this.devicePixelHeight = this.canvas.height;
        this.drawingBufferWidth = this.canvas.width;
        this.drawingBufferHeight = this.canvas.height;
        this.devicePixelRatio = globalThis.devicePixelRatio || 1;
        this._position = [0, 0];
        if (CanvasSurface.isHTMLCanvas(this.canvas)) {
            this._intersectionObserver = new IntersectionObserver(entries => this._handleIntersection(entries));
            this._intersectionObserver.observe(this.canvas);
            this._resizeObserver = new ResizeObserver(entries => this._handleResize(entries));
            try {
                this._resizeObserver.observe(this.canvas, { box: 'device-pixel-content-box' });
            }
            catch {
                this._resizeObserver.observe(this.canvas, { box: 'content-box' });
            }
            this._observeDevicePixelRatioTimeout = setTimeout(() => this._observeDevicePixelRatio(), 0);
            if (this.props.trackPosition) {
                this._trackPosition();
            }
        }
    }
    destroy() {
        if (!this.destroyed) {
            this.destroyed = true;
            if (this._observeDevicePixelRatioTimeout) {
                clearTimeout(this._observeDevicePixelRatioTimeout);
                this._observeDevicePixelRatioTimeout = null;
            }
            // @ts-expect-error Clear the device to make sure we don't access it after destruction.
            this.device = null;
            this._resizeObserver?.disconnect();
            this._intersectionObserver?.disconnect();
        }
    }
    setProps(props) {
        if ('useDevicePixels' in props) {
            this.props.useDevicePixels = props.useDevicePixels || false;
            this._updateDrawingBufferSize();
        }
        return this;
    }
    /** Returns a framebuffer with properly resized current 'swap chain' textures */
    getCurrentFramebuffer(options) {
        this._resizeDrawingBufferIfNeeded();
        return this._getCurrentFramebuffer(options);
    }
    getCSSSize() {
        return [this.cssWidth, this.cssHeight];
    }
    getPosition() {
        return this._position;
    }
    getDevicePixelSize() {
        return [this.devicePixelWidth, this.devicePixelHeight];
    }
    getDrawingBufferSize() {
        return [this.drawingBufferWidth, this.drawingBufferHeight];
    }
    getMaxDrawingBufferSize() {
        const maxTextureDimension = this.device.limits.maxTextureDimension2D;
        return [maxTextureDimension, maxTextureDimension];
    }
    setDrawingBufferSize(width, height) {
        width = Math.floor(width);
        height = Math.floor(height);
        if (this.drawingBufferWidth === width && this.drawingBufferHeight === height) {
            return;
        }
        this.drawingBufferWidth = width;
        this.drawingBufferHeight = height;
        this._needsDrawingBufferResize = true;
    }
    getDevicePixelRatio() {
        const devicePixelRatio = typeof window !== 'undefined' && window.devicePixelRatio;
        return devicePixelRatio || 1;
    }
    cssToDevicePixels(cssPixel, yInvert = true) {
        const ratio = this.cssToDeviceRatio();
        const [width, height] = this.getDrawingBufferSize();
        return scalePixels(cssPixel, ratio, width, height, yInvert);
    }
    /** @deprecated - use .getDevicePixelSize() */
    getPixelSize() {
        return this.getDevicePixelSize();
    }
    /** @deprecated - TODO which values should we use for aspect */
    getAspect() {
        const [width, height] = this.getDevicePixelSize();
        return width / height;
    }
    /** @deprecated Returns multiplier need to convert CSS size to Device size */
    cssToDeviceRatio() {
        try {
            const [drawingBufferWidth] = this.getDrawingBufferSize();
            const [cssWidth] = this.getCSSSize();
            return cssWidth ? drawingBufferWidth / cssWidth : 1;
        }
        catch {
            return 1;
        }
    }
    /** @deprecated Use canvasContext.setDrawingBufferSize() */
    resize(size) {
        this.setDrawingBufferSize(size.width, size.height);
    }
    _setAutoCreatedCanvasId(id) {
        if (this.htmlCanvas?.id === 'lumagl-auto-created-canvas') {
            this.htmlCanvas.id = id;
        }
    }
    _handleIntersection(entries) {
        if (this.destroyed) {
            return;
        }
        const entry = entries.find(entry_ => entry_.target === this.canvas);
        if (!entry) {
            return;
        }
        const isVisible = entry.isIntersecting;
        if (this.isVisible !== isVisible) {
            this.isVisible = isVisible;
            this.device.props.onVisibilityChange(this);
        }
    }
    _handleResize(entries) {
        if (this.destroyed) {
            return;
        }
        const entry = entries.find(entry_ => entry_.target === this.canvas);
        if (!entry) {
            return;
        }
        const contentBoxSize = assertDefined(entry.contentBoxSize?.[0]);
        this.cssWidth = contentBoxSize.inlineSize;
        this.cssHeight = contentBoxSize.blockSize;
        const oldPixelSize = this.getDevicePixelSize();
        const devicePixelWidth = entry.devicePixelContentBoxSize?.[0]?.inlineSize ||
            contentBoxSize.inlineSize * devicePixelRatio;
        const devicePixelHeight = entry.devicePixelContentBoxSize?.[0]?.blockSize ||
            contentBoxSize.blockSize * devicePixelRatio;
        const [maxDevicePixelWidth, maxDevicePixelHeight] = this.getMaxDrawingBufferSize();
        this.devicePixelWidth = Math.max(1, Math.min(devicePixelWidth, maxDevicePixelWidth));
        this.devicePixelHeight = Math.max(1, Math.min(devicePixelHeight, maxDevicePixelHeight));
        this._updateDrawingBufferSize();
        this.device.props.onResize(this, { oldPixelSize });
    }
    _updateDrawingBufferSize() {
        if (this.props.autoResize) {
            if (typeof this.props.useDevicePixels === 'number') {
                const devicePixelRatio = this.props.useDevicePixels;
                this.setDrawingBufferSize(this.cssWidth * devicePixelRatio, this.cssHeight * devicePixelRatio);
            }
            else if (this.props.useDevicePixels) {
                this.setDrawingBufferSize(this.devicePixelWidth, this.devicePixelHeight);
            }
            else {
                this.setDrawingBufferSize(this.cssWidth, this.cssHeight);
            }
        }
        this._initializedResolvers.resolve();
        this.isInitialized = true;
        this.updatePosition();
    }
    _resizeDrawingBufferIfNeeded() {
        if (this._needsDrawingBufferResize) {
            this._needsDrawingBufferResize = false;
            const sizeChanged = this.drawingBufferWidth !== this.canvas.width ||
                this.drawingBufferHeight !== this.canvas.height;
            if (sizeChanged) {
                this.canvas.width = this.drawingBufferWidth;
                this.canvas.height = this.drawingBufferHeight;
                this._configureDevice();
            }
        }
    }
    _observeDevicePixelRatio() {
        if (this.destroyed) {
            return;
        }
        const oldRatio = this.devicePixelRatio;
        this.devicePixelRatio = window.devicePixelRatio;
        this.updatePosition();
        this.device.props.onDevicePixelRatioChange?.(this, {
            oldRatio
        });
        matchMedia(`(resolution: ${this.devicePixelRatio}dppx)`).addEventListener('change', () => this._observeDevicePixelRatio(), { once: true });
    }
    _trackPosition(intervalMs = 100) {
        const intervalId = setInterval(() => {
            if (this.destroyed) {
                clearInterval(intervalId);
            }
            else {
                this.updatePosition();
            }
        }, intervalMs);
    }
    updatePosition() {
        if (this.destroyed) {
            return;
        }
        const newRect = this.htmlCanvas?.getBoundingClientRect();
        if (newRect) {
            const position = [newRect.left, newRect.top];
            this._position ??= position;
            const positionChanged = position[0] !== this._position[0] || position[1] !== this._position[1];
            if (positionChanged) {
                const oldPosition = this._position;
                this._position = position;
                this.device.props.onPositionChange?.(this, {
                    oldPosition
                });
            }
        }
    }
}
function getContainer(container) {
    if (typeof container === 'string') {
        const element = document.getElementById(container);
        if (!element) {
            throw new Error(`${container} is not an HTML element`);
        }
        return element;
    }
    if (container) {
        return container;
    }
    return document.body;
}
function getCanvasFromDOM(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!CanvasSurface.isHTMLCanvas(canvas)) {
        throw new Error('Object is not a canvas element');
    }
    return canvas;
}
function createCanvasElement(props) {
    const { width, height } = props;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = uid('lumagl-auto-created-canvas');
    newCanvas.width = width || 1;
    newCanvas.height = height || 1;
    newCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
    newCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
    if (!props?.visible) {
        newCanvas.style.visibility = 'hidden';
    }
    const container = getContainer(props?.container || null);
    container.insertBefore(newCanvas, container.firstChild);
    return newCanvas;
}
function scalePixels(pixel, ratio, width, height, yInvert) {
    const point = pixel;
    const x = scaleX(point[0], ratio, width);
    let y = scaleY(point[1], ratio, height, yInvert);
    let temporary = scaleX(point[0] + 1, ratio, width);
    const xHigh = temporary === width - 1 ? temporary : temporary - 1;
    temporary = scaleY(point[1] + 1, ratio, height, yInvert);
    let yHigh;
    if (yInvert) {
        temporary = temporary === 0 ? temporary : temporary + 1;
        yHigh = y;
        y = temporary;
    }
    else {
        yHigh = temporary === height - 1 ? temporary : temporary - 1;
    }
    return {
        x,
        y,
        width: Math.max(xHigh - x + 1, 1),
        height: Math.max(yHigh - y + 1, 1)
    };
}
function scaleX(x, ratio, width) {
    return Math.min(Math.round(x * ratio), width - 1);
}
function scaleY(y, ratio, height, yInvert) {
    return yInvert
        ? Math.max(0, height - 1 - Math.round(y * ratio))
        : Math.min(Math.round(y * ratio), height - 1);
}
