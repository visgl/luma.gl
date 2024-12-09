// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@probe.gl/env';
import type {Device} from './device';
import type {Framebuffer} from './resources/framebuffer';
import {log} from '../utils/log';
import {uid} from '../utils/uid';
import type {TextureFormat} from '../gpu-type-utils/texture-formats';

/** Properties for a CanvasContext */
export type CanvasContextProps = {
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
  /** Whether to apply a device pixels scale factor (`true` uses browser DPI) */
  useDevicePixels?: boolean | number;
  /** Whether to track window resizes */
  autoResize?: boolean;
  /** https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode */
  alphaMode?: 'opaque' | 'premultiplied';
  /** https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace */
  colorSpace?: 'srgb'; // GPUPredefinedColorSpace
};

/**
 * Manages a canvas. Supports both HTML or offscreen canvas
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit(): https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export abstract class CanvasContext {
  static defaultProps: Required<CanvasContextProps> = {
    canvas: null,
    width: 800, // width are height are only used by headless gl
    height: 600,
    useDevicePixels: true,
    autoResize: true,
    container: null,
    visible: true,
    alphaMode: 'opaque',
    colorSpace: 'srgb'
  };

  abstract readonly device: Device;
  readonly id: string;
  readonly props: Required<CanvasContextProps>;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly htmlCanvas?: HTMLCanvasElement;
  readonly offscreenCanvas?: OffscreenCanvas;
  readonly type: 'html-canvas' | 'offscreen-canvas' | 'node';

  /** Format of returned textures: "bgra8unorm", "rgba8unorm" */
  abstract readonly format: TextureFormat;
  /** Default stencil format for depth textures */
  abstract readonly depthStencilFormat: TextureFormat;

  width: number = 1;
  height: number = 1;

  readonly resizeObserver: ResizeObserver | undefined;

  /** State used by luma.gl classes: TODO - move to canvasContext*/
  readonly _canvasSizeInfo = {clientWidth: 0, clientHeight: 0, devicePixelRatio: 1};

  abstract get [Symbol.toStringTag](): string;

  toString(): string {
    return `${this[Symbol.toStringTag]}(${this.id})`;
  }

  constructor(props?: CanvasContextProps) {
    this.props = {...CanvasContext.defaultProps, ...props};
    props = this.props;

    if (!isBrowser()) {
      this.id = 'node-canvas-context';
      this.type = 'node';
      this.width = this.props.width;
      this.height = this.props.height;
      // TODO - does this prevent app from using jsdom style polyfills?
      this.canvas = null!;
      return;
    }

    if (!props.canvas) {
      const canvas = createCanvas(props);
      const container = getContainer(props?.container || null);
      container.insertBefore(canvas, container.firstChild);

      this.canvas = canvas;

      if (!props?.visible) {
        this.canvas.style.visibility = 'hidden';
      }
    } else if (typeof props.canvas === 'string') {
      this.canvas = getCanvasFromDOM(props.canvas);
    } else {
      this.canvas = props.canvas;
    }

    if (this.canvas instanceof HTMLCanvasElement) {
      this.id = this.canvas.id;
      this.type = 'html-canvas';
      this.htmlCanvas = this.canvas;
    } else {
      this.id = 'offscreen-canvas';
      this.type = 'offscreen-canvas';
      this.offscreenCanvas = this.canvas;
    }

    // React to size changes
    if (this.canvas instanceof HTMLCanvasElement && props.autoResize) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === this.canvas) {
            this.update();
          }
        }
      });
      this.resizeObserver.observe(this.canvas);
    }
  }

  /** Returns a framebuffer with properly resized current 'swap chain' textures */
  abstract getCurrentFramebuffer(): Framebuffer;

  /**
   * Returns the current DPR, if props.useDevicePixels is true
   * Device refers to physical
   */
  getDevicePixelRatio(useDevicePixels?: boolean | number): number {
    if (typeof OffscreenCanvas !== 'undefined' && this.canvas instanceof OffscreenCanvas) {
      return 1;
    }

    useDevicePixels = useDevicePixels === undefined ? this.props.useDevicePixels : useDevicePixels;

    if (!useDevicePixels || (useDevicePixels as number) <= 0) {
      return 1;
    }

    // The param was mainly provide to support the test cases, could be removed
    if (useDevicePixels === true) {
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio;
      return dpr || 1;
    }

    return useDevicePixels;
  }

  /**
   * Returns the size of drawing buffer in device pixels.
   * @note This can be different from the 'CSS' size of a canvas, and also from the
   * canvas' internal drawing buffer size (.width, .height).
   * This is the size required to cover the canvas, adjusted for DPR
   */
  getPixelSize(): [number, number] {
    switch (this.type) {
      case 'node':
        return [this.width, this.height];
      case 'offscreen-canvas':
        return [this.canvas.width, this.canvas.height];
      case 'html-canvas':
        const dpr = this.getDevicePixelRatio();
        const canvas = this.canvas as HTMLCanvasElement;
        // If not attached to DOM client size can be 0
        return canvas.parentElement
          ? [canvas.clientWidth * dpr, canvas.clientHeight * dpr]
          : [this.canvas.width, this.canvas.height];
      default:
        throw new Error(this.type);
    }
  }

  getAspect(): number {
    const [width, height] = this.getPixelSize();
    return width / height;
  }

  /**
   * Returns multiplier need to convert CSS size to Device size
   */
  cssToDeviceRatio(): number {
    try {
      // For headless gl we might have used custom width and height
      // hence use cached clientWidth
      const [drawingBufferWidth] = this.getDrawingBufferSize();
      // _canvasSizeInfo may not be populated if `setDevicePixelRatio` is never called
      const clientWidth = this._canvasSizeInfo.clientWidth || this.htmlCanvas?.clientWidth;
      return clientWidth ? drawingBufferWidth / clientWidth : 1;
    } catch {
      return 1;
    }
  }

  /**
   * Maps CSS pixel position to device pixel position
   */
  cssToDevicePixels(
    cssPixel: number[],
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

  /**
   * Use devicePixelRatio to set canvas width and height
   * @note this is a raw port of luma.gl v8 code. Might be worth a review
   */
  setDevicePixelRatio(
    devicePixelRatio: number,
    options: {width?: number; height?: number} = {}
  ): void {
    if (!this.htmlCanvas) {
      return;
    }

    // NOTE: if options.width and options.height not used remove in v8
    let clientWidth = 'width' in options ? options.width : this.htmlCanvas.clientWidth;
    let clientHeight = 'height' in options ? options.height : this.htmlCanvas.clientHeight;

    if (!clientWidth || !clientHeight) {
      log.log(1, 'Canvas clientWidth/clientHeight is 0')();
      // by forcing devicePixel ratio to 1, we do not scale canvas.width and height in each frame.
      devicePixelRatio = 1;
      clientWidth = this.htmlCanvas.width || 1;
      clientHeight = this.htmlCanvas.height || 1;
    }

    const cachedSize = this._canvasSizeInfo;
    // Check if canvas needs to be resized
    if (
      cachedSize.clientWidth !== clientWidth ||
      cachedSize.clientHeight !== clientHeight ||
      cachedSize.devicePixelRatio !== devicePixelRatio
    ) {
      let clampedPixelRatio = devicePixelRatio;

      const canvasWidth = Math.floor(clientWidth * clampedPixelRatio);
      const canvasHeight = Math.floor(clientHeight * clampedPixelRatio);
      this.htmlCanvas.width = canvasWidth;
      this.htmlCanvas.height = canvasHeight;

      // @ts-expect-error This only works for WebGL
      const gl = this.device.gl;
      if (gl) {
        // Note: when devicePixelRatio is too high, it is possible we might hit system limit for
        // drawing buffer width and hight, in those cases they get clamped and resulting aspect ration may not be maintained
        // for those cases, reduce devicePixelRatio.
        const [drawingBufferWidth, drawingBufferHeight] = this.getDrawingBufferSize();

        if (drawingBufferWidth !== canvasWidth || drawingBufferHeight !== canvasHeight) {
          clampedPixelRatio = Math.min(
            drawingBufferWidth / clientWidth,
            drawingBufferHeight / clientHeight
          );

          this.htmlCanvas.width = Math.floor(clientWidth * clampedPixelRatio);
          this.htmlCanvas.height = Math.floor(clientHeight * clampedPixelRatio);

          log.warn('Device pixel ratio clamped')();
        }

        this._canvasSizeInfo.clientWidth = clientWidth;
        this._canvasSizeInfo.clientHeight = clientHeight;
        this._canvasSizeInfo.devicePixelRatio = devicePixelRatio;
      }
    }
  }

  // PRIVATE

  /** @todo Major hack done to port the CSS methods above, base canvas context should not depend on WebGL */
  getDrawingBufferSize(): [number, number] {
    // @ts-expect-error This only works for WebGL
    const gl = this.device.gl;
    if (!gl) {
      // use default device pixel ratio
      throw new Error('canvas size');
    }
    return [gl.drawingBufferWidth, gl.drawingBufferHeight];
  }

  abstract resize(options?: {
    width?: number;
    height?: number;
    useDevicePixels?: boolean | number;
  }): void;

  /** Perform platform specific updates (WebGPU vs WebGL) */
  protected abstract update(): void;

  /**
   * Allows subclass constructor to override the canvas id for auto created canvases.
   * This can really help when debugging DOM in apps that create multiple devices
   */
  protected _setAutoCreatedCanvasId(id: string) {
    if (this.htmlCanvas?.id === 'lumagl-auto-created-canvas') {
      this.htmlCanvas.id = id;
    }
  }
}

// HELPER FUNCTIONS

function getContainer(container: HTMLElement | string | null): HTMLElement {
  if (typeof container === 'string') {
    const element = document.getElementById(container);
    if (!element) {
      throw new Error(`${container} is not an HTML element`);
    }
    return element;
  } else if (container) {
    return container;
  }
  return document.body;
}

/** Get a Canvas element from DOM id */
function getCanvasFromDOM(canvasId: string): HTMLCanvasElement {
  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Object is not a canvas element');
  }
  return canvas;
}

/** Create a new canvas */
function createCanvas(props: CanvasContextProps) {
  const {width, height} = props;
  const targetCanvas = document.createElement('canvas');
  targetCanvas.id = uid('lumagl-auto-created-canvas');
  targetCanvas.width = width || 1;
  targetCanvas.height = height || 1;
  targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  return targetCanvas;
}

/**
 *
 * @param pixel
 * @param ratio
 * @param width
 * @param height
 * @param yInvert
 * @returns
 */
function scalePixels(
  pixel: number[],
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
  const point = pixel as [number, number];

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
