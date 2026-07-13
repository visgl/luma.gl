// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Sampler, SamplerProps, TextureProps} from '@luma.gl/core';
import {Texture} from '@luma.gl/core';
import type {TextureBindingSource} from '@luma.gl/engine';

const HTML_CANVAS_LAYOUT_SUBTREE_ATTRIBUTE = 'layoutsubtree';

type PaintableHTMLCanvasElement = HTMLCanvasElement & {
  layoutSubtree?: boolean;
  requestPaint?: () => void;
};

type ElementTextureSource = Element;
type HTMLTextureBindingLayout = Parameters<TextureBindingSource['resolveTextureBinding']>[0];

export type HTMLTextureProps = Pick<TextureProps, 'format' | 'id' | 'sampler' | 'usage'> & {
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
 * Live copied texture binding source backed by an HTML-in-Canvas DOM subtree.
 *
 * The browser owns layout, paint invalidation, accessibility, and pointer routing for the DOM
 * subtree. luma.gl owns only the GPU texture lifetime and the DOM-to-texture copy issued on paint.
 */
export class HTMLTexture implements TextureBindingSource {
  /** Device used to create copied texture bindings. */
  readonly device: Device;
  /** Stable resource identifier used in loading and debug messages. */
  readonly id: string;
  readonly canvas: PaintableHTMLCanvasElement;
  readonly element: ElementTextureSource;
  readonly autoUpdate: boolean;
  readonly observeResize: boolean;
  readonly sourceHeight: number | undefined;
  readonly sourceWidth: number | undefined;

  /** Whether this HTML texture has been destroyed. */
  destroyed = false;
  /** Monotonic binding generation advanced when concrete draw bindings may need recreation. */
  generation = 0;

  private _texture: Texture;
  private readonly _format: NonNullable<TextureProps['format']>;
  private _sampler: Sampler | SamplerProps;
  private _updateTimestamp: number;
  private readonly _usage: number;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly handlePaint = () => this.uploadElementImage();

  constructor(device: Device, props: HTMLTextureProps) {
    const {
      autoUpdate = false,
      canvas,
      element,
      format = 'rgba8unorm',
      height,
      id,
      observeResize = false,
      sampler = {},
      sourceHeight,
      sourceWidth,
      usage = Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER,
      width
    } = props;
    assertElementIsCanvasChild(canvas, element);

    this.device = device;
    this._format = format;
    this._sampler = sampler;
    this._usage = usage;
    this._texture = this.createTexture({height, width}, id);
    this.id = this._texture.id;
    this._updateTimestamp = this.device.incrementTimestamp();
    this.canvas = canvas;
    this.element = element;
    this.autoUpdate = autoUpdate;
    this.observeResize = observeResize;
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;

    HTMLTexture.configureCanvas(canvas);
    this.canvas.addEventListener('paint', this.handlePaint);
    this.startObservers();
    this.requestUpdate();
  }

  /** Current copied texture binding. */
  get texture(): Texture {
    return this._texture;
  }

  /** Whether this source can resolve its copied texture binding. */
  get isReady(): boolean {
    return !this.destroyed;
  }

  /** Device timestamp of the most recent source content or binding identity update. */
  get updateTimestamp(): number {
    return this._updateTimestamp;
  }

  /** Resource label used by debug output. */
  get [Symbol.toStringTag]() {
    return 'HTMLTexture';
  }

  /** Formats the current copied texture dimensions and readiness for debug output. */
  toString(): string {
    return `HTMLTexture:"${this.id}":${this.texture.width}x${this.texture.height}px:(${this.isReady ? 'ready' : 'destroyed'})`;
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
    return (
      Boolean(canvas) &&
      typeof (canvas as PaintableHTMLCanvasElement).requestPaint === 'function' &&
      device.features.has('html-in-canvas')
    );
  }

  requestUpdate(): void {
    if (this.destroyed) {
      return;
    }
    const requestPaint = this.canvas.requestPaint;
    if (typeof requestPaint !== 'function') {
      throw new Error(`${this} canvas.requestPaint() is not available`);
    }
    requestPaint.call(this.canvas);
  }

  resize(size: {width: number; height: number}): boolean {
    if (this.destroyed) {
      return false;
    }
    if (this.texture.width === size.width && this.texture.height === size.height) {
      return false;
    }

    const texture = this.createTexture(size, this.id);
    this.texture.destroy();
    this._texture = texture;
    this._touchGeneration();
    this.requestUpdate();
    return true;
  }

  resolveTextureBinding(bindingLayout: HTMLTextureBindingLayout): Texture | null {
    if (!this.isReady) {
      return null;
    }
    if (bindingLayout.type === 'external-texture') {
      throw new Error(
        `${this} cannot resolve external-texture binding; use texture_2d for copied HTML path`
      );
    }
    return this.texture;
  }

  setSampler(sampler: Sampler | SamplerProps): void {
    this._sampler = sampler;
    this.texture.setSampler(sampler);
    this._touchGeneration();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.canvas.removeEventListener('paint', this.handlePaint);
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.texture.destroy();
    this.destroyed = true;
    this._touchGeneration();
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

  private createTexture(size: {width: number; height: number}, id?: string): Texture {
    return this.device.createTexture({
      ...(id ? {id} : {}),
      ...size,
      format: this._format,
      mipLevels: 1,
      sampler: this._sampler,
      usage: this._usage
    });
  }

  private _touch(): void {
    this._updateTimestamp = this.device.incrementTimestamp();
  }

  private _touchGeneration(): void {
    this.generation++;
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
  if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
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
