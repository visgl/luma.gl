// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('HTMLTexture configures paint cycle and tracks DOM uploads', async t => {
  const device = await getNullTestDevice();
  const fakeCanvas = new FakeCanvas();
  const canvas = fakeCanvas as unknown as HTMLCanvasElement;
  const element = {
    parentElement: canvas,
    getBoundingClientRect: () => ({width: 2, height: 2})
  } as unknown as Element;
  const texture = new HTMLTexture(device, {
    canvas,
    element,
    width: 2,
    height: 2
  });
  const initialTimestamp = texture.updateTimestamp;

  t.true(texture.isReady, 'copied HTML texture is ready after allocation');
  t.true(fakeCanvas.hasAttribute('layoutsubtree'), 'constructor enables layoutsubtree');
  t.equal(fakeCanvas.requestPaintCount, 1, 'constructor requests the first paint');
  t.equal(
    texture.texture.props.usage,
    Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER,
    'default texture usage supports WebGPU element-image copies'
  );
  t.equal(
    texture.resolveTextureBinding(TEXTURE_BINDING),
    texture.texture,
    'ordinary texture slots resolve copied HTML texture'
  );
  t.throws(
    () => texture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
    /use texture_2d for copied HTML path/,
    'HTML textures do not resolve through external texture slots'
  );

  texture.requestUpdate();
  t.equal(fakeCanvas.requestPaintCount, 2, 'requestUpdate delegates to canvas.requestPaint');

  fakeCanvas.dispatch('paint');
  t.ok(texture.updateTimestamp > initialTimestamp, 'paint uploads element and updates timestamp');

  texture.destroy();
  t.false(texture.isReady, 'destroy makes HTML texture unavailable');
  t.equal(texture.resolveTextureBinding(TEXTURE_BINDING), null, 'destroy clears texture binding');
  const destroyTimestamp = texture.updateTimestamp;
  fakeCanvas.dispatch('paint');
  t.equal(texture.updateTimestamp, destroyTimestamp, 'destroy removes paint listener');

  t.end();
});

test('HTMLTexture rejects elements that are not direct canvas children', async t => {
  const device = await getNullTestDevice();
  const fakeCanvas = new FakeCanvas();
  const canvas = fakeCanvas as unknown as HTMLCanvasElement;
  const element = {parentElement: {}} as unknown as Element;

  t.throws(
    () =>
      new HTMLTexture(device, {
        canvas,
        element,
        width: 2,
        height: 2
      }),
    /direct child/,
    'nested source elements are rejected before browser upload'
  );

  t.end();
});

test('HTMLTexture.isSupported gates luma.gl HTML-in-Canvas feature', t => {
  const fakeCanvas = new FakeCanvas();
  const canvas = fakeCanvas as unknown as HTMLCanvasElement;

  const supportedDevice = {
    features: {
      has: (feature: string) => feature === 'html-in-canvas'
    }
  };
  const unsupportedDevice = {
    features: {
      has: () => false
    }
  };

  t.true(
    HTMLTexture.isSupported(supportedDevice as unknown as Device, canvas),
    'luma.gl HTML-in-Canvas feature is supported'
  );
  t.false(
    HTMLTexture.isSupported(unsupportedDevice as unknown as Device, canvas),
    'missing luma.gl HTML-in-Canvas feature is unsupported'
  );

  t.end();
});
