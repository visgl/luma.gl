// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, describe, expect, it, vi} from 'vitest';
import {Texture, type Device} from '@luma.gl/core';
import {HTMLTexture} from '@luma.gl/experimental';
import {getNullTestDevice} from '@luma.gl/test-utils';

const TEXTURE_BINDING = {
  type: 'texture',
  name: 'htmlTexture',
  group: 0,
  location: 0
} as const;
const EXTERNAL_TEXTURE_BINDING = {
  type: 'external-texture',
  name: 'htmlTexture',
  group: 0,
  location: 0
} as const;

class FakeCanvas {
  private readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, Set<() => void>>();
  requestPaintCount = 0;

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  requestPaint(): void {
    this.requestPaintCount++;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

function makeSource(
  canvas: HTMLCanvasElement,
  bounds: {width: number; height: number} = {width: 2, height: 2}
): Element {
  return {
    parentElement: canvas,
    getBoundingClientRect: () => bounds
  } as unknown as Element;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('HTMLTexture', () => {
  it('configures the paint cycle, uploads the DOM source, and releases its binding', async () => {
    const device = await getNullTestDevice();
    const fakeCanvas = new FakeCanvas();
    const canvas = fakeCanvas as unknown as HTMLCanvasElement;
    const texture = new HTMLTexture(device, {
      canvas,
      element: makeSource(canvas),
      width: 2,
      height: 2
    });
    const initialTimestamp = texture.updateTimestamp;
    const copyElementImage = vi.spyOn(texture.texture.constructor.prototype, 'copyElementImage');

    expect(texture.isReady).toBe(true);
    expect(texture[Symbol.toStringTag]).toBe('HTMLTexture');
    expect(texture.toString()).toContain(':2x2px:(ready)');
    expect(fakeCanvas.hasAttribute('layoutsubtree')).toBe(true);
    expect(fakeCanvas.requestPaintCount).toBe(1);
    expect(texture.texture.props.usage).toBe(Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER);
    expect(texture.resolveTextureBinding(TEXTURE_BINDING)).toBe(texture.texture);
    expect(() => texture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING)).toThrow(
      /use texture_2d for copied HTML path/
    );

    texture.requestUpdate();
    expect(fakeCanvas.requestPaintCount).toBe(2);

    fakeCanvas.dispatch('paint');
    expect(copyElementImage).toHaveBeenCalledWith({
      element: texture.element,
      height: 2,
      sourceHeight: 2,
      sourceWidth: 2,
      width: 2
    });
    expect(texture.updateTimestamp).toBeGreaterThan(initialTimestamp);

    texture.destroy();
    const destroyTimestamp = texture.updateTimestamp;
    const paintCount = fakeCanvas.requestPaintCount;
    expect(texture.isReady).toBe(false);
    expect(texture.toString()).toContain('(destroyed)');
    expect(texture.resolveTextureBinding(TEXTURE_BINDING)).toBeNull();
    expect(texture.resize({width: 4, height: 4})).toBe(false);
    texture.requestUpdate();
    texture.destroy();
    fakeCanvas.dispatch('paint');
    expect(fakeCanvas.requestPaintCount).toBe(paintCount);
    expect(texture.updateTimestamp).toBe(destroyTimestamp);
  });

  it('resizes bindings, updates samplers, and preserves explicit copy dimensions', async () => {
    const device = await getNullTestDevice();
    const fakeCanvas = new FakeCanvas();
    const canvas = fakeCanvas as unknown as HTMLCanvasElement;
    const texture = new HTMLTexture(device, {
      canvas,
      element: makeSource(canvas, {width: 8, height: 6}),
      id: 'html-texture-test',
      sourceHeight: 5,
      sourceWidth: 7,
      width: 2,
      height: 2
    });

    expect(texture.resize({width: 2, height: 2})).toBe(false);
    expect(texture.resize({width: 4, height: 3})).toBe(true);
    expect(texture.texture.id).toBe('html-texture-test');
    expect(texture.texture.width).toBe(4);
    expect(texture.texture.height).toBe(3);
    expect(texture.generation).toBe(1);

    const copyElementImage = vi.spyOn(texture.texture.constructor.prototype, 'copyElementImage');
    fakeCanvas.dispatch('paint');
    expect(copyElementImage).toHaveBeenCalledWith({
      element: texture.element,
      height: 3,
      sourceHeight: 5,
      sourceWidth: 7,
      width: 4
    });

    const setSampler = vi.spyOn(texture.texture.constructor.prototype, 'setSampler');
    const sampler = {magFilter: 'nearest'} as const;
    texture.setSampler(sampler);
    expect(setSampler).toHaveBeenCalledWith(sampler);
    expect(texture.generation).toBe(2);
    texture.destroy();
  });

  it('rejects invalid DOM relationships and missing paint support', async () => {
    const device = await getNullTestDevice();
    const fakeCanvas = new FakeCanvas();
    const canvas = fakeCanvas as unknown as HTMLCanvasElement;

    expect(
      () =>
        new HTMLTexture(device, {
          canvas,
          element: {parentElement: {}} as unknown as Element,
          width: 2,
          height: 2
        })
    ).toThrow(/direct child/);

    const canvasWithoutPaint = {
      addEventListener: vi.fn(),
      hasAttribute: () => true,
      setAttribute: vi.fn()
    } as unknown as HTMLCanvasElement;
    expect(
      () =>
        new HTMLTexture(device, {
          canvas: canvasWithoutPaint,
          element: makeSource(canvasWithoutPaint),
          width: 2,
          height: 2
        })
    ).toThrow(/requestPaint\(\) is not available/);
  });

  it('detects and configures HTML-in-Canvas support', () => {
    const fakeCanvas = new FakeCanvas();
    const canvas = fakeCanvas as unknown as HTMLCanvasElement;
    const supportedDevice = {
      features: {has: (feature: string) => feature === 'html-in-canvas'}
    } as unknown as Device;
    const unsupportedDevice = {
      features: {has: () => false}
    } as unknown as Device;

    expect(HTMLTexture.isSupported(supportedDevice, canvas)).toBe(true);
    expect((canvas as HTMLCanvasElement & {layoutSubtree?: boolean}).layoutSubtree).toBe(true);
    expect(HTMLTexture.isSupported(unsupportedDevice, canvas)).toBe(false);
    expect(HTMLTexture.isSupported(supportedDevice, null)).toBe(false);
  });

  it('starts and disconnects requested mutation and resize observers', async () => {
    const mutationDisconnect = vi.fn();
    const resizeDisconnect = vi.fn();
    const mutationObserve = vi.fn();
    const resizeObserve = vi.fn();
    vi.stubGlobal(
      'MutationObserver',
      class {
        disconnect = mutationDisconnect;
        observe = mutationObserve;
      }
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = resizeDisconnect;
        observe = resizeObserve;
      }
    );

    const device = await getNullTestDevice();
    const fakeCanvas = new FakeCanvas();
    const canvas = fakeCanvas as unknown as HTMLCanvasElement;
    const element = makeSource(canvas);
    const texture = new HTMLTexture(device, {
      autoUpdate: true,
      canvas,
      element,
      height: 2,
      observeResize: true,
      width: 2
    });

    expect(mutationObserve).toHaveBeenCalledWith(element, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });
    expect(resizeObserve).toHaveBeenCalledWith(element);
    texture.destroy();
    expect(mutationDisconnect).toHaveBeenCalledOnce();
    expect(resizeDisconnect).toHaveBeenCalledOnce();
  });
});
