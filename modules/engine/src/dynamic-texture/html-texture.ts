// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {Texture} from '@luma.gl/core';
import {DynamicTexture, type DynamicTextureProps} from './dynamic-texture';

const HTML_CANVAS_LAYOUT_SUBTREE_ATTRIBUTE = 'layoutsubtree';

type PaintableHTMLCanvasElement = HTMLCanvasElement & {
  layoutSubtree?: boolean;
  requestPaint?: () => void;
};

type ElementTextureSource = Element;

export type HTMLTextureProps = Omit<
  DynamicTextureProps,
  'data' | 'dimension' | 'height' | 'mipmaps' | 'width'
> & {
  /** Canvas participating in the HTML-in-Canvas paint cycle. */
  canvas: HTMLCanvasElement;
  /** DOM subtree copied into this GPU texture. */
  element: ElementTextureSource;
  /** Texture width in pixels. */
  width: number;
  /** Texture height in pixels. */
  height: number;
  /** Source DOM box width in CSS pixels. Defaults to the element border box width. */
  sourceWidth?: number;
  /** Source DOM box height in CSS pixels. Defaults to the element border box height. */
  sourceHeight?: number;
  /** Request a repaint when the subtree mutates. */
  autoUpdate?: boolean;
  /** Request a repaint when the subtree size changes. */
  observeResize?: boolean;
};

/**
 * Dynamic texture backed by an HTML-in-Canvas DOM subtree.
 *
 * The browser owns layout, paint invalidation, accessibility, and pointer routing for the DOM
 * subtree. luma.gl owns only the GPU texture lifetime and the DOM-to-texture copy issued on paint.
 */
export class HTMLTexture extends DynamicTexture {
  readonly canvas: PaintableHTMLCanvasElement;
  readonly element: ElementTextureSource;
  readonly autoUpdate: boolean;
  readonly observeResize: boolean;
  readonly sourceHeight: number | undefined;
  readonly sourceWidth: number | undefined;

  private pendingPaint = false;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly handlePaint = () => this.uploadElementImage();

  constructor(device: Device, props: HTMLTextureProps) {
    const {
      autoUpdate = false,
      canvas,
      element,
      height,
      observeResize = false,
      sourceHeight,
      sourceWidth,
      width,
      ...textureProps
    } = props;
    assertElementIsCanvasChild(canvas, element);

    const resolvedTextureProps = {
      ...textureProps,
      data: null,
      dimension: '2d',
      height,
      mipmaps: false,
      usage: textureProps.usage ?? Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
      width
    } satisfies DynamicTextureProps;

    super(device, resolvedTextureProps);

    this.canvas = canvas;
    this.element = element;
    this.autoUpdate = autoUpdate;
    this.observeResize = observeResize;
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;

    HTMLTexture.configureCanvas(canvas);
    this.canvas.addEventListener('paint', this.handlePaint);
    this.startObservers();
    void this.ready.then(() => {
      if (this.pendingPaint) {
        this.pendingPaint = false;
        this.uploadElementImage();
      }
    });
    this.requestUpdate();
  }

  static configureCanvas(canvas: HTMLCanvasElement): void {
    (canvas as PaintableHTMLCanvasElement).layoutSubtree = true;
    if (!canvas.hasAttribute(HTML_CANVAS_LAYOUT_SUBTREE_ATTRIBUTE)) {
      canvas.setAttribute(HTML_CANVAS_LAYOUT_SUBTREE_ATTRIBUTE, '');
    }
  }

  static isSupported(device: Device, canvas?: HTMLCanvasElement | null): boolean {
    if (canvas) {
      HTMLTexture.configureCanvas(canvas);
    }
    if (!canvas || typeof (canvas as PaintableHTMLCanvasElement).requestPaint !== 'function') {
      return false;
    }

    switch (device.type) {
      case 'webgpu':
        return (
          typeof (
            device as Device & {
              handle?: {queue?: {copyElementImageToTexture?: unknown}};
            }
          ).handle?.queue?.copyElementImageToTexture === 'function'
        );
      case 'webgl':
        return (
          typeof (
            device as Device & {
              gl?: {texElementImage2D?: unknown};
            }
          ).gl?.texElementImage2D === 'function'
        );
      default:
        return false;
    }
  }

  requestUpdate(): void {
    const requestPaint = this.canvas.requestPaint;
    if (typeof requestPaint !== 'function') {
      throw new Error(`${this} canvas.requestPaint() is not available`);
    }
    requestPaint.call(this.canvas);
  }

  override resize(size: {width: number; height: number}): boolean {
    const resized = super.resize(size);
    if (resized) {
      this.requestUpdate();
    }
    return resized;
  }

  override destroy(): void {
    this.canvas.removeEventListener('paint', this.handlePaint);
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    super.destroy();
  }

  private startObservers(): void {
    if (this.autoUpdate && typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.requestUpdate());
      this.mutationObserver.observe(this.element, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true
      });
    }

    if (this.observeResize && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.requestUpdate());
      this.resizeObserver.observe(this.element);
    }
  }

  private uploadElementImage(): void {
    if (this.destroyed) {
      return;
    }
    if (!this.isReady) {
      this.pendingPaint = true;
      return;
    }

    const sourceSize = getElementBorderBoxSize(this.element);
    this.texture.copyElementImage({
      element: this.element,
      height: this.texture.height,
      sourceHeight: this.sourceHeight ?? sourceSize.height,
      sourceWidth: this.sourceWidth ?? sourceSize.width,
      width: this.texture.width
    });
    this._touch();
  }
}

function assertElementIsCanvasChild(
  canvas: HTMLCanvasElement,
  element: ElementTextureSource
): void {
  if (element.parentElement !== canvas) {
    throw new Error('HTMLTexture element must be a direct child of the HTML-in-Canvas canvas');
  }
}

function getElementBorderBoxSize(element: ElementTextureSource): {width: number; height: number} {
  if (element instanceof HTMLElement) {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }

  const bounds = element.getBoundingClientRect();
  return {
    width: bounds.width,
    height: bounds.height
  };
}
