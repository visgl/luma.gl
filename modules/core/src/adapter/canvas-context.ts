// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@probe.gl/env';
import type {Device} from './device';
import type {Framebuffer} from './resources/framebuffer';
import type {DepthStencilTextureFormat} from '../shadertypes/texture-formats';
import {uid} from '../utils/uid';
import {withResolvers} from '../utils/promise-utils';

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
  /** Whether to size the drawing buffer to the pixel size during auto resize */
  useDevicePixels?: boolean;
  /** Whether to track window resizes */
  autoResize?: boolean;
  /** @see https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode */
  alphaMode?: 'opaque' | 'premultiplied';
  /** @see https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace */
  colorSpace?: 'srgb'; // GPUPredefinedColorSpace
};

/**
 * Manages a canvas. Supports both HTML or offscreen canvas
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit() @see https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export abstract class CanvasContext {
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
    colorSpace: 'srgb'
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

  protected _initializedResolvers = withResolvers<void>();

  /** Promise that resolved once the resize observer has updated the pixel size */
  initialized: Promise<void>;
  isInitialized: boolean = false;

  /** Visibility is automatically updated (via an IntersectionObserver) */
  isVisible: boolean = true;

  /** Device pixel ratio. Automatically updated via media queries */
  devicePixelRatio: number;

  /** Width of canvas in CSS units (tracked by a ResizeObserver) */
  cssWidth: number;
  /** Height of canvas in CSS units (tracked by a ResizeObserver) */
  cssHeight: number;

  /** Exact width of canvas in physical pixels (tracked by a ResizeObserver) */
  pixelWidth: number;
  /** Exact height of canvas in physical pixels (tracked by a ResizeObserver) */
  pixelHeight: number;

  /** Width of drawing buffer: automatically tracks this.pixelWidth if props.autoResize is true */
  drawingBufferWidth: number;
  /** Height of drawing buffer: automatically tracks this.pixelHeight if props.autoResize is true */
  drawingBufferHeight: number;

  protected readonly _resizeObserver: ResizeObserver | undefined;
  protected readonly _intersectionObserver: IntersectionObserver | undefined;

  abstract get [Symbol.toStringTag](): string;

  toString(): string {
    return `${this[Symbol.toStringTag]}(${this.id})`;
  }

  constructor(props?: CanvasContextProps) {
    this.props = {...CanvasContext.defaultProps, ...props};
    props = this.props;

    this.initialized = this._initializedResolvers.promise;

    // Create a canvas element if needed
    if (!isBrowser()) {
      // TODO - does this prevent app from using jsdom style polyfills?
      this.canvas = {width: props.width || 1, height: props.height || 1} as OffscreenCanvas;
    } else if (!props.canvas) {
      this.canvas = createCanvasElement(props);
    } else if (typeof props.canvas === 'string') {
      this.canvas = getCanvasFromDOM(props.canvas);
    } else {
      this.canvas = props.canvas;
    }

    if (CanvasContext.isHTMLCanvas(this.canvas)) {
      this.id = props.id || this.canvas.id;
      this.type = 'html-canvas';
      this.htmlCanvas = this.canvas;
    } else if (CanvasContext.isOffscreenCanvas(this.canvas)) {
      this.id = props.id || 'offscreen-canvas';
      this.type = 'offscreen-canvas';
      this.offscreenCanvas = this.canvas;
    } else {
      // TODO - Node.js support is currently untested (was used for headless-gl in luma v8)
      this.id = props.id || 'node-canvas-context';
      this.type = 'node';
    }

    // Initialize size variables (these will be updated by ResizeObserver)
    this.cssWidth = this.htmlCanvas?.clientWidth || this.canvas.width;
    this.cssHeight = this.htmlCanvas?.clientHeight || this.canvas.height;
    this.pixelWidth = this.canvas.width;
    this.pixelHeight = this.canvas.height;
    this.drawingBufferWidth = this.canvas.width;
    this.drawingBufferHeight = this.canvas.height;
    this.devicePixelRatio = globalThis.devicePixelRatio || 1;

    if (CanvasContext.isHTMLCanvas(this.canvas)) {
      // Track visibility changes
      this._intersectionObserver = new IntersectionObserver(entries =>
        this._handleIntersection(entries)
      );
      this._intersectionObserver.observe(this.canvas);

      // Track size changes
      this._resizeObserver = new ResizeObserver(entries => this._handleResize(entries));
      try {
        this._resizeObserver.observe(this.canvas, {box: 'device-pixel-content-box'});
      } catch {
        // Safari fallback
        this._resizeObserver.observe(this.canvas, {box: 'content-box'});
      }

      // Track device pixel ratio changes.
      // Defer call to after construction completes to ensure `this.device` is available.
      setTimeout(() => this._observeDevicePixelRatio(), 0);
    }
  }

  /** Returns a framebuffer with properly resized current 'swap chain' textures */
  abstract getCurrentFramebuffer(options?: {
    depthStencilFormat?: DepthStencilTextureFormat | false;
  }): Framebuffer;

  // SIZE METHODS

  /**
   * Returns the size covered by the canvas in CSS pixels
   * @note This can be different from the actual device pixel size of a canvas due to DPR scaling, and rounding to integer pixels
   * @note This is independent of the canvas' internal drawing buffer size (.width, .height).
   */
  getCSSSize(): [number, number] {
    return [this.cssWidth, this.cssHeight];
  }

  /**
   * Returns the size covered by the canvas in actual device pixels.
   * @note This can be different from the 'CSS' size of a canvas due to DPR scaling, and rounding to integer pixels
   * @note This is independent of the canvas' internal drawing buffer size (.width, .height).
   */
  getPixelSize(): [number, number] {
    return [this.pixelWidth, this.pixelHeight];
  }

  /** Get the drawing buffer size (number of pixels GPU is rendering into, can be different from CSS size) */
  getDrawingBufferSize(): [number, number] {
    return [this.drawingBufferWidth, this.drawingBufferHeight];
  }

  /** Returns the biggest allowed framebuffer size. @todo Allow the application to limit this? */
  getMaxDrawingBufferSize(): [number, number] {
    const maxTextureDimension = this.device.limits.maxTextureDimension2D;
    return [maxTextureDimension, maxTextureDimension];
  }

  /** Update the canvas drawing buffer size. Called automatically if props.autoResize is true. */
  setDrawingBufferSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;

    this.drawingBufferWidth = width;
    this.drawingBufferHeight = height;
  }

  /** @deprecated - TODO which values should we use for aspect */
  getAspect(): number {
    const [width, height] = this.getPixelSize();
    return width / height;
  }

  /**
   * Returns multiplier need to convert CSS size to Device size
   */
  cssToDeviceRatio(): number {
    return this.htmlCanvas ? this.drawingBufferWidth / this.cssWidth : 1;
  }

  /**
   * Maps CSS pixel position to device pixel position
   */
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

  // SUBCLASS OVERRIDES

  /**
   * Performs platform specific updates (WebGPU vs WebGL)
   * Can be called after changes to size or props,
   * to give implementation an opportunity to update configurations.
   */
  abstract _updateConfiguration(): void;

  // IMPLEMENTATION

  /**
   * Allows subclass constructor to override the canvas id for auto created canvases.
   * This can really help when debugging DOM in apps that create multiple devices
   */
  protected _setAutoCreatedCanvasId(id: string) {
    if (this.htmlCanvas?.id === 'lumagl-auto-created-canvas') {
      this.htmlCanvas.id = id;
    }
  }

  /** reacts to an observed intersection */
  protected _handleIntersection(entries: IntersectionObserverEntry[]) {
    const entry = entries.find(entry_ => entry_.target === this.canvas);
    if (!entry) {
      return;
    }
    // TODO - store intersection rectangle?
    const isVisible = entry.isIntersecting;
    if (this.isVisible !== isVisible) {
      this.isVisible = isVisible;
      this.device.props.onVisibilityChange(this);
    }
  }

  /**
   * Reacts to an observed resize by using the most accurate pixel size information the browser can provide
   * @see https://web.dev/articles/device-pixel-content-box
   * @see https://webgpufundamentals.org/webgpu/lessons/webgpu-resizing-the-canvas.html
   */
  protected _handleResize(entries: ResizeObserverEntry[]) {
    const entry = entries.find(entry_ => entry_.target === this.canvas);
    if (!entry) {
      return;
    }

    // Update CSS size using content box size
    this.cssWidth = entry.contentBoxSize[0].inlineSize;
    this.cssHeight = entry.contentBoxSize[0].blockSize;

    // Update our drawing buffer size variables, saving the old values for logging
    const oldPixelSize = this.getPixelSize();

    // Use the most accurate drawing buffer size information the current browser can provide
    // Note: content box sizes are guaranteed to be integers
    // Note: Safari falls back to contentBoxSize
    const pixelWidth =
      entry.devicePixelContentBoxSize?.[0].inlineSize ||
      entry.contentBoxSize[0].inlineSize * devicePixelRatio;

    const pixelHeight =
      entry.devicePixelContentBoxSize?.[0].blockSize ||
      entry.contentBoxSize[0].blockSize * devicePixelRatio;

    // Make sure we don't overflow the maximum supported texture size
    const [maxPixelWidth, maxPixelHeight] = this.getMaxDrawingBufferSize();
    this.pixelWidth = Math.max(1, Math.min(pixelWidth, maxPixelWidth));
    this.pixelHeight = Math.max(1, Math.min(pixelHeight, maxPixelHeight));

    // Update the canvas drawing buffer size
    if (this.props.autoResize) {
      if (this.props.useDevicePixels) {
        this.setDrawingBufferSize(this.pixelWidth, this.pixelHeight);
      } else {
        this.setDrawingBufferSize(this.cssWidth, this.cssHeight);
      }

      // Inform the subclass
      this._updateConfiguration();
    }

    // Resolve the initialized promise
    this._initializedResolvers.resolve();
    this.isInitialized = true;

    // Inform the device
    this.device.props.onResize(this, {oldPixelSize});
  }

  /** Monitor DPR changes */
  _observeDevicePixelRatio() {
    const oldRatio = this.devicePixelRatio;
    this.devicePixelRatio = window.devicePixelRatio;

    // Inform the device
    this.device.props.onDevicePixelRatioChange(this, {oldRatio});
    // Set up a one time query against the current resolution.
    matchMedia(`(resolution: ${this.devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => this._observeDevicePixelRatio(),
      {once: true}
    );
  }
}

// HELPER FUNCTIONS

/** Get a container element from a string or DOM element */
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

/** Get a Canvas element from DOM id */
function getCanvasFromDOM(canvasId: string): HTMLCanvasElement {
  const canvas = document.getElementById(canvasId);
  if (!CanvasContext.isHTMLCanvas(canvas)) {
    throw new Error('Object is not a canvas element');
  }
  return canvas;
}

/** Create a new canvas */
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
  // Insert the canvas in the DOM
  const container = getContainer(props?.container || null);
  container.insertBefore(newCanvas, container.firstChild);

  return newCanvas;
}

/**
 * Scales pixels linearly, handles edge cases
 * @param pixel
 * @param ratio
 * @param width
 * @param height
 * @param yInvert
 * @returns
 */
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

  // Find boundaries of next pixel to provide valid range of device pixel locations

  let t = scaleX(point[0] + 1, ratio, width);
  // If next pixel's position is clamped to boundary, use it as is, otherwise subtract 1 for current pixel boundary
  const xHigh = t === width - 1 ? t : t - 1;

  t = scaleY(point[1] + 1, ratio, height, yInvert);
  let yHigh;
  if (yInvert) {
    // If next pixel's position is clamped to boundary, use it as is, otherwise clamp it to valid range
    t = t === 0 ? t : t + 1;
    // swap y and yHigh
    yHigh = y;
    y = t;
  } else {
    // If next pixel's position is clamped to boundary, use it as is, otherwise clamp it to valid range
    yHigh = t === height - 1 ? t : t - 1;
    // y remains same
  }
  return {
    x,
    y,
    // when ratio < 1, current css pixel and next css pixel may point to same device pixel, set width/height to 1 in those cases.
    width: Math.max(xHigh - x + 1, 1),
    height: Math.max(yHigh - y + 1, 1)
  };
}

function scaleX(x: number, ratio: number, width: number): number {
  // since we are rounding to nearest, when ratio > 1, edge pixels may point to out of bounds value, clamp to the limit
  const r = Math.min(Math.round(x * ratio), width - 1);
  return r;
}

function scaleY(y: number, ratio: number, height: number, yInvert: boolean): number {
  // since we are rounding to nearest, when ratio > 1, edge pixels may point to out of bounds value, clamp to the limit
  return yInvert
    ? Math.max(0, height - 1 - Math.round(y * ratio))
    : Math.min(Math.round(y * ratio), height - 1);
}
