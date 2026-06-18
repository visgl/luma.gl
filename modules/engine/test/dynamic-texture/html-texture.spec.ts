// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Texture, type Device} from '@luma.gl/core';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {HTMLTexture} from '../../src/index';

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

  await texture.ready;
  t.true(fakeCanvas.hasAttribute('layoutsubtree'), 'constructor enables layoutsubtree');
  t.equal(fakeCanvas.requestPaintCount, 1, 'constructor requests the first paint');
  t.equal(
    texture.props.usage,
    Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    'default texture usage supports WebGPU element-image copies'
  );

  texture.requestUpdate();
  t.equal(fakeCanvas.requestPaintCount, 2, 'requestUpdate delegates to canvas.requestPaint');

  fakeCanvas.dispatch('paint');
  t.ok(texture.updateTimestamp > initialTimestamp, 'paint uploads element and updates timestamp');

  const uploadTimestamp = texture.updateTimestamp;
  texture.destroy();
  fakeCanvas.dispatch('paint');
  t.equal(texture.updateTimestamp, uploadTimestamp, 'destroy removes paint listener');

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

test('HTMLTexture.isSupported gates experimental backend upload paths', t => {
  const fakeCanvas = new FakeCanvas();
  const canvas = fakeCanvas as unknown as HTMLCanvasElement;

  const webglDevice = {
    type: 'webgl',
    gl: {
      texElementImage2D() {}
    }
  };
  const webgpuDevice = {
    type: 'webgpu',
    handle: {
      queue: {
        copyElementImageToTexture() {}
      }
    }
  };

  t.true(
    HTMLTexture.isSupported(webglDevice as unknown as Device, canvas),
    'WebGL texElementImage2D path is supported'
  );
  t.true(
    HTMLTexture.isSupported(webgpuDevice as unknown as Device, canvas),
    'WebGPU copyElementImageToTexture path is supported'
  );

  t.end();
});
