// luma.gl, MIT license
import {isBrowser} from 'probe.gl/env';

const isPage: boolean = isBrowser() && typeof document !== 'undefined';
const isPageLoaded: () => boolean = () => isPage && document.readyState === 'complete';

export type CanvasContextProps = {
  canvas?: HTMLCanvasElement | OffscreenCanvas | string;
  width?: number;
  height?: number;
  useDevicePixels?: boolean | number;
  autoResize?: boolean;
  // WebGPU https://www.w3.org/TR/webgpu/#canvas-configuration
  // colorSpace: "srgb"; // GPUPredefinedColorSpace 
  // compositingAlphaMode = "opaque"; | 'premultiplied'
};

const DEFAULT_CANVAS_CONTEXT_PROPS: Partial<CanvasContextProps> = {
  autoResize: true
};

/**
 * Manages a canvas. Supports both HTML or offscreen canvas
 * - Creates a new canvas or looks up a canvas from the DOM
 * - Provides check for DOM loaded
 * @todo commit(): https://github.com/w3ctag/design-reviews/issues/288
 * @todo transferControlToOffscreen: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
 */
export default abstract class CanvasContext {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  resizeObserver: ResizeObserver | undefined;
  props: Partial<CanvasContextProps>;

  /** Check if the DOM is loaded */
  static get isPageLoaded(): boolean {
    return isPageLoaded();
  }

  /** 
   * Get a "lazy" promise that resolves when the DOM is loaded.
   * @note Since there may be limitations on number of `load` event listeners,
   * it is recommended avoid calling this function until actually needed.
   * I.e. don't call it until you know that you will be looking up a string in the DOM.
   */
  static get pageLoaded(): Promise<void> {
    return getPageLoadPromise();
  }

  constructor(props?: CanvasContextProps) {
    props = {...DEFAULT_CANVAS_CONTEXT_PROPS, ...props};
    this.props = props;
    if (!props.canvas) {
      this.canvas = createCanvas(props);
    } else if (typeof props.canvas === 'string') {
      this.canvas = getCanvasFromDOM(props.canvas);
    } else {
      this.canvas = props.canvas;
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

  /** Returns the current DPR, if props.useDevicePixels is true */
  getDevicePixelRatio(): number {
    if (this.canvas instanceof OffscreenCanvas) {
      return 1;
    }
    if (typeof this.props.useDevicePixels === 'number') {
      return this.props.useDevicePixels;
    }
    return this.props.useDevicePixels ? window.devicePixelRatio || 1 : 1;
  }

  /** 
   * Returns the size in pixels required to cover the canvas, adjusted for DPR
   * @note This can be different from the 'CSS' size of a canvas, and also from the
   * canvas' internal drawing buffer size (.width, .height).
   */
  getPixelSize(): [number, number] {
    if (this.canvas instanceof OffscreenCanvas) {
      return [this.canvas.width, this.canvas.height];
    }
    const dpr = this.getDevicePixelRatio();
    return [this.canvas.clientWidth * dpr, this.canvas.clientHeight * dpr];
  }

  /** Perform platform specific updates (WebGPU vs WebGL) */
  abstract update(): void;
}

// Internal API

/** Create a new canvas */
function createCanvas(props: CanvasContextProps) {
  const {width = 800, height = 600} = props;
  const targetCanvas = document.createElement('canvas');
  targetCanvas.id = 'lumagl-canvas';
  targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  document.body.insertBefore(targetCanvas, document.body.firstChild);
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
