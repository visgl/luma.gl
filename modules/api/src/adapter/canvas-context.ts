// luma.gl, MIT license
import {isBrowser} from 'probe.gl/env';
import type Device from './device';
import type Framebuffer from './resources/framebuffer';

const isPage: boolean = isBrowser() && typeof document !== 'undefined';
const isPageLoaded: () => boolean = () => isPage && document.readyState === 'complete';

/** Properties for a CanvasContext */
export type CanvasContextProps = {
  /** If canvas not supplied, will be created and added to the DOM. If string, will be looked up in the DOM */
  canvas?: HTMLCanvasElement | OffscreenCanvas | string;
  /** Width in pixels of the canvas */
  width?: number;
  /** Height in pixels of the canvas */
  height?: number;
  /** Whether to apply a device pixels scale factor (`true` uses browser DPI) */
  useDevicePixels?: boolean | number;
  /** Whether to track resizes (if not ) */
  autoResize?: boolean;
  /** Parent DOM element. If omitted, added as first child of document.body (only used if new canvas is created) */
  container?: HTMLElement;
  /** Visibility (only used if new canvas is created). */
  visible?: boolean;
  /** WebGPU only https://www.w3.org/TR/webgpu/#canvas-configuration */
<<<<<<< HEAD
  colorSpace?: 'srgb', // GPUPredefinedColorSpace 
=======
  colorSpace?: 'srgb', // GPUPredefinedColorSpace
>>>>>>> fix(website): Ensure all examples run again against new api
  /** WebGPU only https://www.w3.org/TR/webgpu/#canvas-configuration */
  compositingAlphaMode?: 'opaque' | 'premultiplied'
};

const DEFAULT_CANVAS_CONTEXT_PROPS: Required<CanvasContextProps> = {
  canvas: undefined,
  width: 800, // width are height are only used by headless gl
  height: 600,
  useDevicePixels: true,
  autoResize: true,
  container: undefined,
  visible: true,
  colorSpace: 'srgb',
  compositingAlphaMode: 'opaque'
};

/**
 * Manages a canvas. Supports both HTML or offscreen canvas
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit(): https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export default abstract class CanvasContext {
  abstract readonly device: Device;
  readonly id: string;
  readonly props: Required<CanvasContextProps>;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly type: 'html-canvas' | 'offscreen-canvas' | 'node';

  width: number;
  height: number;

  readonly resizeObserver: ResizeObserver | undefined;

  /** Check if the DOM is loaded */
  static get isPageLoaded(): boolean {
    return isPageLoaded();
  }

  /** 
   * Get a 'lazy' promise that resolves when the DOM is loaded.
   * @note Since there may be limitations on number of `load` event listeners,
   * it is recommended avoid calling this function until actually needed.
   * I.e. don't call it until you know that you will be looking up a string in the DOM.
   */
  static get pageLoaded(): Promise<void> {
    return getPageLoadPromise();
  }

  constructor(props?: CanvasContextProps) {
    this.props = {...DEFAULT_CANVAS_CONTEXT_PROPS, ...props};
    props = this.props;

    if (!isBrowser()) {
      this.id = 'node.js';
      this.type = 'node';
      this.width = props.width;
      this.height = props.height;
      return;
    }

    if (!props.canvas) {
      this.canvas = createCanvas(props);
      if (props?.container) {
        props?.container.appendChild(this.canvas);
      } else {
        document.body.insertBefore(this.canvas, document.body.firstChild);
      }
      if (!props?.visible) {
        this.canvas.style.visibility = 'hidden';
      }
    } else if (typeof props.canvas === 'string') {
      this.canvas = getCanvasFromDOM(props.canvas);
    } else {
      this.canvas = props.canvas;
    }
    this.id = this.canvas instanceof HTMLCanvasElement ? this.canvas.id : 'offscreen-canvas';
    this.type = this.canvas instanceof HTMLCanvasElement ? 'html-canvas' : 'offscreen-canvas';

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
  getDevicePixelRatio(): number {
    if (typeof OffscreenCanvas !== 'undefined' && this.canvas instanceof OffscreenCanvas) {
      return 1;
    }
    if (typeof this.props.useDevicePixels === 'number') {
      return this.props.useDevicePixels;
    }
    return this.props.useDevicePixels ? window.devicePixelRatio || 1 : 1;
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
          ? [canvas.clientWidth * dpr,  canvas.clientHeight * dpr]
          : [this.canvas.width, this.canvas.height];
    }
  }

  getAspect(): number {
    const [width, height] = this.getPixelSize();
    return width / height;
  }

  abstract resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void;

  /** Perform platform specific updates (WebGPU vs WebGL) */
  abstract update(): void;
}

// Internal API

/** Create a new canvas */
function createCanvas(props: CanvasContextProps) {
  const {width, height} = props;
  const targetCanvas = document.createElement('canvas');
  targetCanvas.id = 'lumagl-canvas';
  targetCanvas.width = width || 1;
  targetCanvas.height = height || 1;
  targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  return targetCanvas;
}

/** Get a Canvas element from DOM id */
function getCanvasFromDOM(canvasId: string): HTMLCanvasElement {
  if (!isPageLoaded()) {
    throw new Error(`Accessing '${canvasId}' before page was loaded`);
  }
  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`'${canvas}' is not a canvas element`);
  }
  return canvas as HTMLCanvasElement;
}

// HELPER FUNCTIONS

let pageLoadPromise: Promise<void> | null = null;

/** Returns a promise that resolves when the page is loaded */
function getPageLoadPromise(): Promise<void> {
  if (!pageLoadPromise) {
    if (isPageLoaded()) {
      pageLoadPromise = Promise.resolve();
    } else {
      pageLoadPromise = new Promise((resolve, reject) => {
        window.addEventListener('load', () => resolve());
      });
    }
  }
  return pageLoadPromise;
}
