// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@probe.gl/env';
import type {Device} from './device';
import type {CanvasContext} from './canvas-context';
import {CanvasObserver} from './canvas-observer';
import type {PresentationContext} from './presentation-context';
import type {Framebuffer} from './resources/framebuffer';
import type {TextureFormatDepthStencil} from '../shadertypes/texture-types/texture-formats';
import {uid} from '../utils/uid';
import {withResolvers} from '../utils/promise-utils';
import {assertDefined} from '../utils/assert';

/** Properties for a CanvasContext */
export type CanvasContextProps = {
  /** Identifier, for debugging */
  id?: string;
  /** If a canvas not supplied, one will be created and added to the DOM. If a string, a canvas with that id will be looked up in the DOM */
  canvas?: HTMLCanvasElement | OffscreenCanvas | string | null;
  /** If new canvas is created, it will be created in the specified container, otherwise is appended as a child of document.body */
  container?: HTMLElement | string | null;
  /** Width in pixels of the canvas - used when creating a new canvas */
  width?: number;
  /** Height in pixels of the canvas - used when creating a new canvas */
  height?: number;
  /** Visibility (only used if new canvas is created). */
  visible?: boolean;
  /** Whether to size the drawing buffer to the pixel size during auto resize. If a number is provided it is used as a static pixel ratio */
  useDevicePixels?: boolean | number;
  /** Whether to track window resizes. */
  autoResize?: boolean;
  /** @see https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode */
  alphaMode?: 'opaque' | 'premultiplied';
  /** @see https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace */
  colorSpace?: 'srgb'; // GPUPredefinedColorSpace
  /** Whether to track position changes. Calls this.device.onPositionChange */
  trackPosition?: boolean;
};

export type MutableCanvasContextProps = {
  /** Whether to size the drawing buffer to the pixel size during auto resize. If a number is provided it is used as a static pixel ratio */
  useDevicePixels?: boolean | number;
};

/**
 * Shared tracked-canvas lifecycle used by both renderable and presentation contexts.
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit() @see https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export abstract class CanvasSurface {
  static isHTMLCanvas(canvas: unknown): canvas is HTMLCanvasElement {
    return typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement;
  }

  static isOffscreenCanvas(canvas: unknown): canvas is OffscreenCanvas {
    return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
  }

  static defaultProps: Required<CanvasContextProps> = {
    id: undefined!,
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

  abstract readonly device: Device;
  abstract readonly handle: unknown;
  readonly id: string;

  readonly props: Required<CanvasContextProps>;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Handle to HTML canvas */
  readonly htmlCanvas?: HTMLCanvasElement;
  /** Handle to wrapped OffScreenCanvas */
  readonly offscreenCanvas?: OffscreenCanvas;
  readonly type: 'html-canvas' | 'offscreen-canvas' | 'node';

  /** Promise that resolved once the resize observer has updated the pixel size */
  initialized: Promise<void>;
  isInitialized: boolean = false;

  /** Visibility is automatically updated (via an IntersectionObserver) */
  isVisible: boolean = true;

  /** Width of canvas in CSS units (tracked by a ResizeObserver) */
  cssWidth: number;
  /** Height of canvas in CSS units (tracked by a ResizeObserver) */
  cssHeight: number;

  /** Device pixel ratio. Automatically updated via media queries */
  devicePixelRatio: number;
  /** Exact width of canvas in physical pixels (tracked by a ResizeObserver) */
  devicePixelWidth: number;
  /** Exact height of canvas in physical pixels (tracked by a ResizeObserver) */
  devicePixelHeight: number;

  /** Width of drawing buffer: automatically tracks this.pixelWidth if props.autoResize is true */
  drawingBufferWidth: number;
  /** Height of drawing buffer: automatically tracks this.pixelHeight if props.autoResize is true */
  drawingBufferHeight: number;

  /** Resolves when the canvas is initialized, i.e. when the ResizeObserver has updated the pixel size */
  protected _initializedResolvers = withResolvers<void>();
  protected _canvasObserver: CanvasObserver;
  /** Position of the canvas in the document, updated by a timer */
  protected _position: [number, number] = [0, 0];
  /** Whether this canvas context has been destroyed */
  protected destroyed = false;
  /** Whether the drawing buffer size needs to be resized (deferred resizing to avoid flicker) */
  protected _needsDrawingBufferResize: boolean = true;

  abstract get [Symbol.toStringTag](): string;

  toString(): string {
    return `${this[Symbol.toStringTag]}(${this.id})`;
  }

  constructor(props?: CanvasContextProps) {
    this.props = {...CanvasSurface.defaultProps, ...props};
    props = this.props;

    this.initialized = this._initializedResolvers.promise;

    if (!isBrowser()) {
      this.canvas = {width: props.width || 1, height: props.height || 1} as OffscreenCanvas;
    } else if (!props.canvas) {
      this.canvas = createCanvasElement(props);
    } else if (typeof props.canvas === 'string') {
      this.canvas = getCanvasFromDOM(props.canvas);
    } else {
      this.canvas = props.canvas;
    }

    if (CanvasSurface.isHTMLCanvas(this.canvas)) {
      this.id = props.id || this.canvas.id;
      this.type = 'html-canvas';
      this.htmlCanvas = this.canvas;
    } else if (CanvasSurface.isOffscreenCanvas(this.canvas)) {
      this.id = props.id || 'offscreen-canvas';
      this.type = 'offscreen-canvas';
      this.offscreenCanvas = this.canvas;
    } else {
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
    this._canvasObserver = new CanvasObserver({
      canvas: this.htmlCanvas,
      trackPosition: this.props.trackPosition,
      onResize: entries => this._handleResize(entries),
      onIntersection: entries => this._handleIntersection(entries),
      onDevicePixelRatioChange: () => this._observeDevicePixelRatio(),
      onPositionChange: () => this.updatePosition()
    });
  }

  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      this._stopObservers();
      // @ts-expect-error Clear the device to make sure we don't access it after destruction.
      this.device = null;
    }
  }

  setProps(props: MutableCanvasContextProps): this {
    if ('useDevicePixels' in props) {
      this.props.useDevicePixels = props.useDevicePixels || false;
      this._updateDrawingBufferSize();
    }
    return this;
  }

  /** Returns a framebuffer with properly resized current 'swap chain' textures */
  getCurrentFramebuffer(options?: {
    depthStencilFormat?: TextureFormatDepthStencil | false;
  }): Framebuffer {
    this._resizeDrawingBufferIfNeeded();
    return this._getCurrentFramebuffer(options);
  }

  getCSSSize(): [number, number] {
    return [this.cssWidth, this.cssHeight];
  }

  getPosition() {
    return this._position;
  }

  getDevicePixelSize(): [number, number] {
    return [this.devicePixelWidth, this.devicePixelHeight];
  }

  getDrawingBufferSize(): [number, number] {
    return [this.drawingBufferWidth, this.drawingBufferHeight];
  }

  getMaxDrawingBufferSize(): [number, number] {
    const maxTextureDimension = this.device.limits.maxTextureDimension2D;
    return [maxTextureDimension, maxTextureDimension];
  }

  setDrawingBufferSize(width: number, height: number) {
    width = Math.floor(width);
    height = Math.floor(height);
    if (this.drawingBufferWidth === width && this.drawingBufferHeight === height) {
      return;
    }
    this.drawingBufferWidth = width;
    this.drawingBufferHeight = height;
    this._needsDrawingBufferResize = true;
  }

  getDevicePixelRatio(): number {
    const devicePixelRatio = typeof window !== 'undefined' && window.devicePixelRatio;
    return devicePixelRatio || 1;
  }

  cssToDevicePixels(
    cssPixel: [number, number],
    yInvert: boolean = true
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const ratio = this.cssToDeviceRatio();
    const [width, height] = this.getDrawingBufferSize();
    return scalePixels(cssPixel, ratio, width, height, yInvert);
  }

  /** @deprecated - use .getDevicePixelSize() */
  getPixelSize() {
    return this.getDevicePixelSize();
  }

  /** @deprecated Use the current drawing buffer size for projection setup. */
  getAspect(): number {
    const [width, height] = this.getDrawingBufferSize();
    return width > 0 && height > 0 ? width / height : 1;
  }

  /** @deprecated Returns multiplier need to convert CSS size to Device size */
  cssToDeviceRatio(): number {
    try {
      const [drawingBufferWidth] = this.getDrawingBufferSize();
      const [cssWidth] = this.getCSSSize();
      return cssWidth ? drawingBufferWidth / cssWidth : 1;
    } catch {
      return 1;
    }
  }

  /** @deprecated Use canvasContext.setDrawingBufferSize() */
  resize(size: {width: number; height: number}): void {
    this.setDrawingBufferSize(size.width, size.height);
  }

  protected abstract _configureDevice(): void;

  protected abstract _getCurrentFramebuffer(options?: {
    depthStencilFormat?: TextureFormatDepthStencil | false;
  }): Framebuffer;

  protected _setAutoCreatedCanvasId(id: string) {
    if (this.htmlCanvas?.id === 'lumagl-auto-created-canvas') {
      this.htmlCanvas.id = id;
    }
  }

  /**
   * Starts DOM observation after the derived context and its device are fully initialized.
   *
   * `CanvasSurface` construction runs before subclasses can assign `this.device`, and the
   * default WebGL canvas context is created before `WebGLDevice` has initialized `limits`,
   * `features`, and the rest of its runtime state. Deferring observer startup avoids early
   * `ResizeObserver` and DPR callbacks running against a partially initialized device.
   */
  _startObservers(): void {
    if (this.destroyed) {
      return;
    }
    this._canvasObserver.start();
  }

  /**
   * Stops all DOM observation and timers associated with a canvas surface.
   *
   * This pairs with `_startObservers()` so teardown uses the same lifecycle whether a context is
   * explicitly destroyed, abandoned during device reuse, or temporarily has not started observing
   * yet. Centralizing shutdown here keeps resize/DPR/position watchers from surviving past the
   * lifetime of the owning device.
   */
  _stopObservers(): void {
    this._canvasObserver.stop();
  }

  protected _handleIntersection(entries: IntersectionObserverEntry[]) {
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
      this.device.props.onVisibilityChange(this as CanvasContext | PresentationContext);
    }
  }

  protected _handleResize(entries: ResizeObserverEntry[]) {
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

    const devicePixelWidth =
      entry.devicePixelContentBoxSize?.[0]?.inlineSize ||
      contentBoxSize.inlineSize * devicePixelRatio;

    const devicePixelHeight =
      entry.devicePixelContentBoxSize?.[0]?.blockSize ||
      contentBoxSize.blockSize * devicePixelRatio;

    const [maxDevicePixelWidth, maxDevicePixelHeight] = this.getMaxDrawingBufferSize();
    this.devicePixelWidth = Math.max(1, Math.min(devicePixelWidth, maxDevicePixelWidth));
    this.devicePixelHeight = Math.max(1, Math.min(devicePixelHeight, maxDevicePixelHeight));

    this._updateDrawingBufferSize();

    this.device.props.onResize(this as CanvasContext | PresentationContext, {oldPixelSize});
  }

  protected _updateDrawingBufferSize() {
    if (this.props.autoResize) {
      if (typeof this.props.useDevicePixels === 'number') {
        const devicePixelRatio = this.props.useDevicePixels;
        this.setDrawingBufferSize(
          this.cssWidth * devicePixelRatio,
          this.cssHeight * devicePixelRatio
        );
      } else if (this.props.useDevicePixels) {
        this.setDrawingBufferSize(this.devicePixelWidth, this.devicePixelHeight);
      } else {
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
      const sizeChanged =
        this.drawingBufferWidth !== this.canvas.width ||
        this.drawingBufferHeight !== this.canvas.height;
      if (sizeChanged) {
        this.canvas.width = this.drawingBufferWidth;
        this.canvas.height = this.drawingBufferHeight;
        this._configureDevice();
      }
    }
  }

  _observeDevicePixelRatio() {
    if (this.destroyed || !this._canvasObserver.started) {
      return;
    }
    const oldRatio = this.devicePixelRatio;
    this.devicePixelRatio = window.devicePixelRatio;

    this.updatePosition();

    this.device.props.onDevicePixelRatioChange?.(this as CanvasContext | PresentationContext, {
      oldRatio
    });
  }

  updatePosition() {
    if (this.destroyed) {
      return;
    }
    const newRect = this.htmlCanvas?.getBoundingClientRect();
    if (newRect) {
      const position: [number, number] = [newRect.left, newRect.top];
      this._position ??= position;
      const positionChanged =
        position[0] !== this._position[0] || position[1] !== this._position[1];
      if (positionChanged) {
        const oldPosition = this._position;
        this._position = position;
        this.device.props.onPositionChange?.(this as CanvasContext | PresentationContext, {
          oldPosition
        });
      }
    }
  }
}

function getContainer(container: HTMLElement | string | null): HTMLElement {
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

function getCanvasFromDOM(canvasId: string): HTMLCanvasElement {
  const canvas = document.getElementById(canvasId);
  if (!CanvasSurface.isHTMLCanvas(canvas)) {
    throw new Error('Object is not a canvas element');
  }
  return canvas;
}

function createCanvasElement(props: CanvasContextProps) {
  const {width, height} = props;
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

function scalePixels(
  pixel: [number, number],
  ratio: number,
  width: number,
  height: number,
  yInvert: boolean
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
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
  } else {
    yHigh = temporary === height - 1 ? temporary : temporary - 1;
  }
  return {
    x,
    y,
    width: Math.max(xHigh - x + 1, 1),
    height: Math.max(yHigh - y + 1, 1)
  };
}

function scaleX(x: number, ratio: number, width: number): number {
  return Math.min(Math.round(x * ratio), width - 1);
}

function scaleY(y: number, ratio: number, height: number, yInvert: boolean): number {
  return yInvert
    ? Math.max(0, height - 1 - Math.round(y * ratio))
    : Math.min(Math.round(y * ratio), height - 1);
}
