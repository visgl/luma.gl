// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';

import {getNullTestDevice, getPresentationWebGLTestDevice, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('WebGLPresentationContext delegates framebuffer sizing and present()', async t => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped WebGL presentation-context test');
    t.end();
    return;
  }

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

  t.end();
});

test('WebGLPresentationContext supports sequential presentation contexts', async t => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped sequential presentation-context test');
    t.end();
    return;
  }

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

  t.end();
});

test('WebGLPresentationContext skips present() for zero-sized destinations', async t => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped zero-size presentation-context test');
    t.end();
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 0;
  destinationCanvas.height = 0;

  const presentationContext = device.createPresentationContext({
    canvas: destinationCanvas,
    autoResize: false,
    width: 0,
    height: 0,
    useDevicePixels: false
  });

  t.doesNotThrow(
    () => presentationContext.present(),
    'present is a no-op when the presentation canvas is zero-sized'
  );

  t.end();
});

test('WebGLPresentationContext fails without a default canvas context', async t => {
  const device = await getPresentationWebGLTestDevice();
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
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    t.pass('OffscreenCanvas unavailable, skipped destination-context failure test');
    t.end();
    return;
  }

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

  t.end();
});

test('WebGPUPresentationContext renders directly to its destination canvas', async t => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.pass('WebGPU unavailable, skipped WebGPU presentation-context test');
    t.end();
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 32;
  destinationCanvas.height = 16;

  const presentationContext = webgpuDevice.createPresentationContext({
    canvas: destinationCanvas,
    width: 32,
    height: 16,
    autoResize: false,
    useDevicePixels: false
  });
  const framebuffer = presentationContext.getCurrentFramebuffer() as any;
  const secondFramebuffer = presentationContext.getCurrentFramebuffer() as any;

  t.ok(framebuffer, 'WebGPU presentation context returns a framebuffer');
  t.equal(
    secondFramebuffer,
    framebuffer,
    'WebGPU presentation context reuses its framebuffer wrapper'
  );
  t.equal(
    secondFramebuffer.colorAttachments[0],
    framebuffer.colorAttachments[0],
    'WebGPU presentation context reuses its texture view wrapper'
  );
  t.equal(
    secondFramebuffer.colorAttachments[0].texture,
    framebuffer.colorAttachments[0].texture,
    'WebGPU presentation context reuses its texture wrapper'
  );
  t.equal(destinationCanvas.width, 32, 'destination canvas width is preserved');
  t.equal(destinationCanvas.height, 16, 'destination canvas height is preserved');

  t.doesNotThrow(() => presentationContext.present(), 'present submits without copy step');

  presentationContext.destroy();
  t.end();
});

test('WebGPUPresentationContext destroy() releases its depth attachment', async t => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.pass('WebGPU unavailable, skipped WebGPU depth-attachment cleanup test');
    t.end();
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 32;
  destinationCanvas.height = 16;

  const presentationContext = webgpuDevice.createPresentationContext({
    canvas: destinationCanvas,
    width: 32,
    height: 16,
    autoResize: false,
    useDevicePixels: false
  });

  presentationContext.getCurrentFramebuffer();

  const depthStencilAttachment = (presentationContext as any).depthStencilAttachment as {
    destroy: () => void;
  } | null;
  const colorAttachment = (presentationContext as any).colorAttachment as {
    destroy: () => void;
  } | null;
  const framebuffer = (presentationContext as any).framebuffer as {destroy: () => void} | null;

  t.ok(depthStencilAttachment, 'presentation context creates a depth attachment by default');
  t.ok(colorAttachment, 'presentation context caches a color attachment wrapper');
  t.ok(framebuffer, 'presentation context caches a framebuffer wrapper');

  let destroyCallCount = 0;
  if (depthStencilAttachment) {
    const originalDestroy = depthStencilAttachment.destroy.bind(depthStencilAttachment);
    depthStencilAttachment.destroy = () => {
      destroyCallCount++;
      originalDestroy();
    };
  }
  let colorDestroyCallCount = 0;
  if (colorAttachment) {
    const originalDestroy = colorAttachment.destroy.bind(colorAttachment);
    colorAttachment.destroy = () => {
      colorDestroyCallCount++;
      originalDestroy();
    };
  }
  let framebufferDestroyCallCount = 0;
  if (framebuffer) {
    const originalDestroy = framebuffer.destroy.bind(framebuffer);
    framebuffer.destroy = () => {
      framebufferDestroyCallCount++;
      originalDestroy();
    };
  }

  presentationContext.destroy();

  t.equal(destroyCallCount, 1, 'destroy releases the cached depth attachment');
  t.equal(colorDestroyCallCount, 1, 'destroy releases the cached color attachment wrapper');
  t.equal(framebufferDestroyCallCount, 1, 'destroy releases the cached framebuffer wrapper');
  t.equal(
    (presentationContext as any).depthStencilAttachment,
    null,
    'destroy clears the cached depth attachment reference'
  );
  t.equal(
    (presentationContext as any).colorAttachment,
    null,
    'destroy clears the cached color attachment reference'
  );
  t.equal(
    (presentationContext as any).framebuffer,
    null,
    'destroy clears the cached framebuffer reference'
  );

  t.end();
});
test('PresentationContext is unsupported on NullDevice', async t => {
  const nullDevice = await getNullTestDevice();
  t.throws(
    () => nullDevice.createPresentationContext({width: 1, height: 1}),
    /not supported/,
    'NullDevice rejects presentation contexts'
  );

  t.end();
});
