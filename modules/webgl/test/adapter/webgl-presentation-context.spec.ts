// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {luma} from '@luma.gl/core';
import {type WebGLDevice, webgl2Adapter} from '@luma.gl/webgl';
import {getNullTestDevice, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

async function createOffscreenWebGLDevice(): Promise<WebGLDevice | null> {
  if (typeof OffscreenCanvas === 'undefined') {
    return null;
  }

  return (await luma.createDevice({
    id: 'webgl-presentation-context-test-device',
    type: 'webgl',
    adapters: [webgl2Adapter],
    createCanvasContext: {canvas: new OffscreenCanvas(4, 4)},
    debug: true
  })) as WebGLDevice;
}

test('WebGLPresentationContext delegates framebuffer sizing and present()', async t => {
  const device = await createOffscreenWebGLDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped WebGL presentation-context test');
    t.end();
    return;
  }

  try {
    const defaultCanvasContext = device.getDefaultCanvasContext();
    const defaultCanvas = defaultCanvasContext.canvas as OffscreenCanvas;
    const destinationCanvas = document.createElement('canvas');
    destinationCanvas.width = 64;
    destinationCanvas.height = 32;

    const originalGetContext = destinationCanvas.getContext.bind(destinationCanvas);
    const drawImageCalls: unknown[][] = [];
    destinationCanvas.getContext = ((
      contextId: '2d',
      options?: CanvasRenderingContext2DSettings
    ) => {
      const context = originalGetContext(contextId, options);
      if (contextId === '2d' && context) {
        const originalDrawImage = context.drawImage.bind(context);
        context.drawImage = ((...args: Parameters<typeof context.drawImage>) => {
          drawImageCalls.push(args);
          return originalDrawImage(...args);
        }) as typeof context.drawImage;
      }
      return context;
    }) as typeof destinationCanvas.getContext;

    const presentationContext = device.createPresentationContext({canvas: destinationCanvas});
    const framebuffer = presentationContext.getCurrentFramebuffer();

    t.ok(framebuffer, 'presentation context returns a framebuffer');
    t.equal(defaultCanvas.width, 64, 'default canvas width matches presentation width');
    t.equal(defaultCanvas.height, 32, 'default canvas height matches presentation height');

    presentationContext.present();

    t.equal(drawImageCalls.length, 1, 'present copies once into the destination canvas');
    t.equal(drawImageCalls[0][0], defaultCanvas, 'present copies from the default canvas');
  } finally {
    device.destroy();
  }

  t.end();
});

test('WebGLPresentationContext supports sequential presentation contexts', async t => {
  const device = await createOffscreenWebGLDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped sequential presentation-context test');
    t.end();
    return;
  }

  try {
    const defaultCanvas = device.getDefaultCanvasContext().canvas as OffscreenCanvas;

    const firstCanvas = document.createElement('canvas');
    firstCanvas.width = 32;
    firstCanvas.height = 16;

    const secondCanvas = document.createElement('canvas');
    secondCanvas.width = 96;
    secondCanvas.height = 48;

    const firstPresentationContext = device.createPresentationContext({canvas: firstCanvas});
    firstPresentationContext.getCurrentFramebuffer();
    firstPresentationContext.present();

    t.equal(defaultCanvas.width, 32, 'first presentation context resizes default canvas width');
    t.equal(defaultCanvas.height, 16, 'first presentation context resizes default canvas height');

    const secondPresentationContext = device.createPresentationContext({canvas: secondCanvas});
    secondPresentationContext.getCurrentFramebuffer();
    secondPresentationContext.present();

    t.equal(defaultCanvas.width, 96, 'second presentation context resizes default canvas width');
    t.equal(defaultCanvas.height, 48, 'second presentation context resizes default canvas height');
  } finally {
    device.destroy();
  }

  t.end();
});

test('WebGLPresentationContext fails without a default canvas context', async t => {
  const device = await createOffscreenWebGLDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped missing-default-context test');
    t.end();
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 8;
  destinationCanvas.height = 8;

  const originalCanvasContext = device.canvasContext;
  // @ts-expect-error testing failure path
  device.canvasContext = null;

  try {
    t.throws(
      () => device.createPresentationContext({canvas: destinationCanvas}),
      /Device has no default CanvasContext/,
      'constructor requires a default canvas context'
    );
  } finally {
    // @ts-expect-error restoring test state
    device.canvasContext = originalCanvasContext;
    device.destroy();
  }

  t.end();
});

test('WebGLPresentationContext fails when default canvas is not offscreen', async t => {
  const device = await getWebGLTestDevice();
  const destinationCanvas = document.createElement('canvas');

  t.throws(
    () => device.createPresentationContext({canvas: destinationCanvas}),
    /requires the default CanvasContext canvas to be an OffscreenCanvas/,
    'constructor requires an offscreen default canvas context'
  );

  t.end();
});

test('WebGLPresentationContext fails when destination canvas has no 2d context', async t => {
  const device = await createOffscreenWebGLDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped destination-context failure test');
    t.end();
    return;
  }

  try {
    const destinationCanvas = document.createElement('canvas');
    const originalGetContext = destinationCanvas.getContext.bind(destinationCanvas);

    destinationCanvas.getContext = ((contextId: string, options?: unknown) => {
      if (contextId === '2d') {
        return null;
      }
      return originalGetContext(contextId as any, options as any);
    }) as typeof destinationCanvas.getContext;

    t.throws(
      () => device.createPresentationContext({canvas: destinationCanvas}),
      /Failed to create 2d presentation context/,
      'constructor requires a destination 2d context'
    );
  } finally {
    device.destroy();
  }

  t.end();
});

test('PresentationContext is unsupported on NullDevice and WebGPUDevice', async t => {
  const nullDevice = await getNullTestDevice();
  t.throws(
    () => nullDevice.createPresentationContext({width: 1, height: 1}),
    /not supported/,
    'NullDevice rejects presentation contexts'
  );

  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.pass('WebGPU unavailable, skipped WebGPU unsupported presentation-context check');
    t.end();
    return;
  }

  t.throws(
    () => webgpuDevice.createPresentationContext({width: 1, height: 1}),
    /not supported/,
    'WebGPUDevice rejects presentation contexts'
  );

  t.end();
});
